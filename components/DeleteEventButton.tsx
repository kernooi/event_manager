"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteEventButtonProps = {
  eventId: string;
  onDeleted?: () => void;
};

type Status = "idle" | "loading" | "error";

export default function DeleteEventButton({
  eventId,
  onDeleted,
}: DeleteEventButtonProps) {
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
      if (onDeleted) {
        onDeleted();
      } else {
        router.refresh();
      }
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
        className="rounded-full border border-[#c05b5b] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8b2f2f] transition hover:bg-[#fff1ed] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Deleting..." : "Delete"}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_30px_70px_-50px_rgba(27,26,24,0.9)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
              Confirm Deletion
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#1b1a18]">
              Delete this event?
            </h3>
            <p className="mt-2 text-sm text-[#6b5a4a]">
              This will permanently remove the event and all related data.
            </p>

            {step === 1 ? (
              <label className="mt-5 flex items-center gap-2 text-sm text-[#3f352c]">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  className="h-4 w-4 rounded border-[#d9c9b9] text-[#1b1a18]"
                />
                I understand this cannot be undone.
              </label>
            ) : (
              <div className="mt-5">
                <label className="flex flex-col gap-2 text-sm font-medium text-[#3f352c]">
                  Type DELETE to confirm
                  <input
                    value={typed}
                    onChange={(event) => setTyped(event.target.value)}
                    placeholder="DELETE"
                    className="h-11 rounded-xl border border-[#d9c9b9] bg-[#fbf8f2] px-4 text-base text-[#1b1a18] outline-none transition focus:border-[#b35b2e] focus:ring-2 focus:ring-[#e6c1a9]"
                  />
                </label>
              </div>
            )}

            {status === "error" ? (
              <p className="mt-4 rounded-xl bg-[#fff1ed] px-4 py-3 text-sm text-[#7a3327]">
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
                className="rounded-full border border-[#d9c9b9] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5b4a3d] transition hover:bg-[#f8f1e8]"
              >
                Cancel
              </button>
              {step === 1 ? (
                <button
                  type="button"
                  disabled={!acknowledged}
                  onClick={() => setStep(2)}
                  className="rounded-full bg-[#1b1a18] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4efe4] transition hover:bg-[#2a2724] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={typed.trim().toUpperCase() !== "DELETE" || status === "loading"}
                  className="rounded-full bg-[#8b2f2f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4efe4] transition hover:bg-[#a63a3a] disabled:cursor-not-allowed disabled:opacity-60"
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
