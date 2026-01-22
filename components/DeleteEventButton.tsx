"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteEventButtonProps = {
  eventId: string;
};

type Status = "idle" | "loading" | "error";

export default function DeleteEventButton({ eventId }: DeleteEventButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [acknowledged, setAcknowledged] = useState(false);
  const [typed, setTyped] = useState("");

  async function handleDelete() {
    setStatus("loading");

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setOpen(false);
      setStep(1);
      setAcknowledged(false);
      setTyped("");
      router.refresh();
    } catch (error) {
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setStatus("idle");
          setStep(1);
          setAcknowledged(false);
          setTyped("");
        }}
        disabled={status === "loading"}
        className="rounded-full border border-[#fca5a5] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#b91c1c] transition hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Deleting..." : "Delete"}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#d6dbe7] bg-white p-6 shadow-[0_14px_30px_-18px_rgba(15,23,42,0.28)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
              Confirm Deletion
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#0f172a]">
              Delete this event?
            </h3>
            <p className="mt-2 text-sm text-[#64748b]">
              This will permanently remove the event and all related data.
            </p>

            {step === 1 ? (
              <label className="mt-5 flex items-center gap-2 text-sm text-[#1f2937]">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  className="h-4 w-4 rounded border-[#d6dbe7] text-[#0f172a]"
                />
                I understand this cannot be undone.
              </label>
            ) : (
              <div className="mt-5">
                <label className="flex flex-col gap-2 text-sm font-medium text-[#1f2937]">
                  Type DELETE to confirm
                  <input
                    value={typed}
                    onChange={(event) => setTyped(event.target.value)}
                    placeholder="DELETE"
                    className="h-11 rounded-lg border border-[#d6dbe7] bg-[#f8fafc] px-4 text-base text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
                  />
                </label>
              </div>
            )}

            {status === "error" ? (
              <p className="mt-4 rounded-lg bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
                Unable to delete. Please try again.
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setStep(1);
                  setAcknowledged(false);
                  setTyped("");
                }}
                className="rounded-full border border-[#d6dbe7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#64748b] transition hover:bg-[#f1f5f9]"
              >
                Cancel
              </button>
              {step === 1 ? (
                <button
                  type="button"
                  disabled={!acknowledged}
                  onClick={() => setStep(2)}
                  className="rounded-full bg-[#0f172a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f5f7fb] transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={typed.trim().toUpperCase() !== "DELETE" || status === "loading"}
                  className="rounded-full bg-[#b91c1c] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f5f7fb] transition hover:bg-[#dc2626] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "loading" ? "Deleting..." : "Delete Event"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}



