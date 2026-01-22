"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";

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

type PopoutType = "success" | "already";

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
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastScanRef = useRef<{ value: string; time: number } | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);
  const popoutRef = useRef<PopoutType | null>(null);

  const [statusMessage, setStatusMessage] = useState<string>("Initializing scanner...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [scannerSupported, setScannerSupported] = useState(true);
  const [popout, setPopout] = useState<PopoutType | null>(null);

  useEffect(() => {
    popoutRef.current = popout;
  }, [popout]);

  const canScan = useMemo(() => {
    if (!startsAt) {
      return true;
    }
    return new Date(startsAt).getTime() <= Date.now();
  }, [startsAt]);

  const stopScanner = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsScanning(false);
  };

  const scheduleResume = (delayMs: number, message = "Scanner ready.") => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      busyRef.current = false;
      setPopout(null);
      setStatusMessage(message);
      if (canScan) {
        void startScanner();
      }
    }, delayMs);
  };

  const pauseAfterScan = (type: PopoutType) => {
    busyRef.current = true;
    setPopout(type);
    stopScanner();
    setStatusMessage("Pausing before next scan...");
    scheduleResume(2000);
  };

  const handleScanResult = async (value: string) => {
    if (busyRef.current) {
      return;
    }
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

    busyRef.current = true;
    stopScanner();
    lastScanRef.current = { value: token, time: now };
    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage("Validating attendee...");

    try {
      const response = await fetch(`/api/events/${eventId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await response.json().catch(() => null)) as ScanResult | ErrorResult | null;

      if (!response.ok) {
        const error =
          data && "error" in data && typeof data.error === "string"
            ? data.error
            : "Unable to check in attendee.";
        const startsAtValue =
          data && "startsAt" in data && typeof data.startsAt === "string"
            ? data.startsAt
            : null;
        setErrorMessage(error);
        if (response.status === 403 && startsAtValue) {
          busyRef.current = false;
          stopScanner();
          setStatusMessage("Check-in opens when the event starts.");
        } else {
          setStatusMessage("Scanner ready.");
          scheduleResume(900);
        }
        return;
      }

      if (data && "status" in data) {
        setResult(data);
        setErrorMessage(null);
        pauseAfterScan(data.status === "already_checked_in" ? "already" : "success");
      }
    } catch (error) {
      setErrorMessage("Network error. Please try again.");
      setStatusMessage("Scanner ready.");
      scheduleResume(900);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startScanner = async () => {
    if (!canScan) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    if (!videoRef.current) {
      return;
    }

    if (!window.isSecureContext) {
      setScannerSupported(false);
      setErrorMessage("Camera access requires HTTPS or localhost.");
      setStatusMessage("Scanner ready.");
      return;
    }

    if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
      setScannerSupported(false);
      setErrorMessage("Camera access is not supported on this device.");
      setStatusMessage("Scanner ready.");
      return;
    }

    setErrorMessage(null);
    setScannerSupported(true);
    setStatusMessage("Requesting camera access...");
    stopScanner();

    try {
      const reader = readerRef.current ?? new BrowserQRCodeReader();
      readerRef.current = reader;
      const useFrontCamera = isMobileDevice();
      const constraints: MediaStreamConstraints = {
        video: useFrontCamera ? { facingMode: { ideal: "user" } } : true,
        audio: false,
      };

      controlsRef.current = await reader.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result, error) => {
          if (busyRef.current || popoutRef.current) {
            return;
          }
          if (result) {
            const value = result.getText().trim();
            if (value) {
              void handleScanResult(value);
            }
          }

          if (error && error.name !== "NotFoundException") {
            setErrorMessage("Unable to read QR code. Try again.");
          }
        }
      );

      setIsScanning(true);
      setStatusMessage("Scanning for QR codes...");
    } catch (error) {
      const isPermissionError =
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "NotFoundError");
      setErrorMessage(
        isPermissionError
          ? "Camera access was blocked. Check permissions and try again."
          : "Unable to access the camera. Check permissions."
      );
      setStatusMessage("Scanner ready.");
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (!canScan) {
      stopScanner();
      setStatusMessage("Check-in opens when the event starts.");
      return;
    }

    void startScanner();

    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
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
    <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      {popout ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/50 px-6">
          <div className="w-full max-w-sm rounded-2xl border border-[#d6dbe7] bg-white p-6 text-center shadow-[0_14px_30px_-18px_rgba(15,23,42,0.28)]">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                popout === "success"
                  ? "bg-[#ecfdf3] text-[#166534]"
                  : "bg-[#fef3c7] text-[#92400e]"
              }`}
            >
              {popout === "success" ? (
                <svg
                  className="h-8 w-8 animate-bounce"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg
                  className="h-8 w-8 animate-bounce"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
              )}
            </div>
            <p className="mt-4 text-lg font-semibold text-[#0f172a]">
              {popout === "success" ? "Check-in successful" : "Already registered"}
            </p>
            <p className="mt-2 text-sm text-[#64748b]">
              {popout === "success"
                ? "Resuming scan in 2 seconds."
                : "This attendee is already checked in."}
            </p>
          </div>
        </div>
      ) : null}
      <div className="rounded-2xl border border-[#d6dbe7] bg-white p-6 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
              Live Scanner
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#0f172a]">
              Point the camera at the QR code
            </h2>
            <p className="mt-2 text-sm text-[#64748b]">
              This scanner uses the front camera on phones and the webcam on
              desktop devices.
            </p>
          </div>
          {isScanning ? (
            <span className="rounded-full bg-[#ecfdf3] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#166534]">
              Live
            </span>
          ) : null}
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
          <video
            ref={videoRef}
            className="aspect-video w-full bg-[#0f172a] object-cover"
            muted
            playsInline
          />
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <p className="text-[#64748b]">{statusMessage}</p>
          {errorMessage ? (
            <p className="rounded-lg bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
              {errorMessage}
            </p>
          ) : null}
          {result ? (
            <p
              className={`rounded-lg px-4 py-3 text-sm font-semibold ${
                result.status === "already_checked_in"
                  ? "bg-[#fef3c7] text-[#92400e]"
                  : "bg-[#ecfdf3] text-[#166534]"
              }`}
            >
              {result.status === "already_checked_in"
                ? `Already checked in at ${formatDateTime(result.checkedInAt)}`
                : `Check-in successful at ${formatDateTime(result.checkedInAt)}`}
            </p>
          ) : null}
          {!canScan && startsAt ? (
            <p className="rounded-lg bg-[#fef3c7] px-4 py-3 text-sm text-[#92400e]">
              Check-in opens at {formatStartsAt(startsAt)}.
            </p>
          ) : null}
        </div>

        <form
          onSubmit={handleManualSubmit}
          className="mt-6 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#4c5b78]">
            Manual check-in
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              value={manualToken}
              onChange={(event) => setManualToken(event.target.value)}
              placeholder="Paste QR link or token"
              className="h-11 flex-1 rounded-lg border border-[#d6dbe7] bg-white px-4 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
            />
            <button
              type="submit"
              disabled={!manualToken.trim() || isSubmitting}
              className="h-11 rounded-full bg-[#0f172a] px-6 text-xs font-semibold uppercase tracking-[0.3em] text-[#f5f7fb] transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Check in
            </button>
          </div>
          {!scannerSupported ? (
            <p className="mt-2 text-xs text-[#64748b]">
              Camera prompts only appear on HTTPS or localhost.
            </p>
          ) : null}
        </form>
      </div>

      <div className="rounded-2xl border border-[#d6dbe7] bg-white p-6 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.25)]">
        <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
          Latest Scan
        </p>
        {result ? (
          <div className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm text-[#64748b]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-semibold text-[#0f172a]">
              {result.attendeeName}
              </p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                  result.status === "already_checked_in"
                    ? "bg-[#fef3c7] text-[#92400e]"
                    : "bg-[#ecfdf3] text-[#166534]"
                }`}
              >
                {result.status === "already_checked_in"
                  ? "Already checked in"
                  : "Checked in"}
              </span>
            </div>
            <p className="mt-3 text-sm text-[#64748b]">
              {result.status === "already_checked_in"
                ? `Already checked in at ${formatDateTime(result.checkedInAt)}`
                : `Checked in at ${formatDateTime(result.checkedInAt)}`}
            </p>
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-[#d6dbe7] p-4 text-sm text-[#64748b]">
            No scans yet. The most recent scan will appear here.
          </p>
        )}
      </div>
    </div>
  );
}



