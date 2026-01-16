"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CheckInScannerProps = {
  eventId: string;
  startsAt: string | null;
};

type ScanResult = {
  status: "checked_in" | "already_checked_in";
  attendeeName: string;
  checkedInAt: string;
};

type ErrorResult = {
  error: string;
  startsAt?: string;
};

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

const MIN_SCAN_INTERVAL_MS = 2500;

function extractToken(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.includes("/checkin/")) {
    const parts = trimmed.split("/checkin/");
    const tokenPart = parts[1] ?? "";
    return tokenPart.split("?")[0].split("#")[0].trim();
  }

  try {
    const url = new URL(trimmed);
    const pathParts = url.pathname.split("/");
    const tokenFromPath = pathParts[pathParts.length - 1]?.trim();
    return tokenFromPath || trimmed;
  } catch {
    return trimmed;
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStartsAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function isMobileDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
}

export default function CheckInScanner({ eventId, startsAt }: CheckInScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const scanningRef = useRef(false);
  const lastScanRef = useRef<{ value: string; time: number } | null>(null);

  const [statusMessage, setStatusMessage] = useState<string>("Initializing scanner...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [scannerSupported, setScannerSupported] = useState(true);

  const canScan = useMemo(() => {
    if (!startsAt) {
      return true;
    }
    return new Date(startsAt).getTime() <= Date.now();
  }, [startsAt]);

  const startScanner = async () => {
    if (!canScan) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }

    if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Camera access is not supported on this device.");
      return;
    }

    const Detector = (
      window as typeof window & {
        BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
      }
    ).BarcodeDetector;

    if (!Detector) {
      setScannerSupported(false);
      setErrorMessage(
        "QR scanning is not supported in this browser. Use Chrome/Edge or paste the QR link."
      );
      return;
    }

    setErrorMessage(null);
    setScannerSupported(true);
    setStatusMessage("Starting camera...");

    try {
      const useFrontCamera = isMobileDevice();
      const constraints: MediaStreamConstraints = {
        video: useFrontCamera ? { facingMode: { ideal: "user" } } : true,
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      detectorRef.current = new Detector({ formats: ["qr_code"] });
      scanningRef.current = true;
      setIsScanning(true);
      setStatusMessage("Scanning for QR codes...");
      requestAnimationFrame(scanFrame);
    } catch (error) {
      setErrorMessage("Unable to access the camera. Check permissions.");
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    scanningRef.current = false;
    setIsScanning(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const handleScanResult = async (value: string) => {
    const token = extractToken(value);
    if (!token) {
      setErrorMessage("Invalid QR code. Try again.");
      return;
    }

    const now = Date.now();
    const lastScan = lastScanRef.current;
    if (lastScan && lastScan.value === token && now - lastScan.time < MIN_SCAN_INTERVAL_MS) {
      return;
    }
    if (isSubmitting) {
      return;
    }

    lastScanRef.current = { value: token, time: now };
    setIsSubmitting(true);
    setStatusMessage("Validating attendee...");

    try {
      const response = await fetch(`/api/events/${eventId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await response.json().catch(() => null)) as ScanResult | ErrorResult | null;

      if (!response.ok) {
        setErrorMessage(data?.error || "Unable to check in attendee.");
        if (response.status === 403 && data?.startsAt) {
          stopScanner();
          setStatusMessage("Check-in opens when the event starts.");
        } else {
          setStatusMessage("Scanner ready.");
        }
        return;
      }

      if (data && "status" in data) {
        setResult(data);
        setErrorMessage(null);
        setStatusMessage("Scanner ready.");
      }
    } catch (error) {
      setErrorMessage("Network error. Please try again.");
      setStatusMessage("Scanner ready.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scanFrame = async () => {
    if (!scanningRef.current || !videoRef.current || !detectorRef.current) {
      return;
    }

    if (videoRef.current.readyState < 2) {
      requestAnimationFrame(scanFrame);
      return;
    }

    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      if (barcodes.length > 0) {
        const value = barcodes[0].rawValue?.trim();
        if (value) {
          await handleScanResult(value);
        }
      }
    } catch (error) {
      setErrorMessage("Unable to read QR code. Try again.");
    }

    requestAnimationFrame(scanFrame);
  };

  useEffect(() => {
    if (!canScan) {
      setStatusMessage("Check-in opens when the event starts.");
      return;
    }

    void startScanner();

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canScan]);

  const handleManualSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!manualToken.trim()) {
      setErrorMessage("Paste a QR code link or token to check in.");
      return;
    }
    await handleScanResult(manualToken);
    setManualToken("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
              Live Scanner
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#1b1a18]">
              Point the camera at the QR code
            </h2>
            <p className="mt-2 text-sm text-[#6b5a4a]">
              This scanner uses the front camera on phones and the webcam on
              desktop devices.
            </p>
          </div>
          {isScanning ? (
            <span className="rounded-full bg-[#e9f3ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2f6d4f]">
              Live
            </span>
          ) : null}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2]">
          <video
            ref={videoRef}
            className="aspect-video w-full bg-[#1b1a18] object-cover"
            muted
            playsInline
          />
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <p className="text-[#5b4a3d]">{statusMessage}</p>
          {errorMessage ? (
            <p className="rounded-xl bg-[#fff1ed] px-4 py-3 text-sm text-[#7a3327]">
              {errorMessage}
            </p>
          ) : null}
          {!canScan && startsAt ? (
            <p className="rounded-xl bg-[#fdf3e8] px-4 py-3 text-sm text-[#9a5a2c]">
              Check-in opens at {formatStartsAt(startsAt)}.
            </p>
          ) : null}
        </div>

        <form
          onSubmit={handleManualSubmit}
          className="mt-6 rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] p-4"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
            Manual check-in
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              value={manualToken}
              onChange={(event) => setManualToken(event.target.value)}
              placeholder="Paste QR link or token"
              className="h-11 flex-1 rounded-xl border border-[#d9c9b9] bg-white px-4 text-sm text-[#1b1a18] outline-none transition focus:border-[#b35b2e] focus:ring-2 focus:ring-[#e6c1a9]"
            />
            <button
              type="submit"
              disabled={!manualToken.trim() || isSubmitting}
              className="h-11 rounded-full bg-[#1b1a18] px-6 text-xs font-semibold uppercase tracking-[0.3em] text-[#f4efe4] transition hover:bg-[#2a2724] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Check in
            </button>
          </div>
          {!scannerSupported ? (
            <p className="mt-2 text-xs text-[#6b5a4a]">
              Camera prompts only appear in browsers that support QR scanning.
            </p>
          ) : null}
        </form>
      </div>

      <div className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
        <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
          Latest Scan
        </p>
        {result ? (
          <div className="mt-4 rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] p-4 text-sm text-[#5b4a3d]">
            <p className="text-base font-semibold text-[#1b1a18]">
              {result.attendeeName}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
              {result.status === "already_checked_in"
                ? "Already checked in"
                : "Checked in"}
            </p>
            <p className="mt-3 text-sm text-[#5b4a3d]">
              {result.status === "already_checked_in"
                ? `Already checked in at ${formatDateTime(result.checkedInAt)}`
                : `Checked in at ${formatDateTime(result.checkedInAt)}`}
            </p>
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-[#d9c9b9] p-4 text-sm text-[#6b5a4a]">
            No scans yet. The most recent scan will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
