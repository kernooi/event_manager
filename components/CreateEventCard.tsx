"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

type Status = "idle" | "loading" | "success" | "error";

export default function CreateEventCard() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || ""),
      startAt: String(formData.get("startAt") || ""),
      endAt: String(formData.get("endAt") || ""),
      location: String(formData.get("location") || ""),
    };

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setStatus("idle");
        pushToast(data?.error || "Unable to create event.", "error");
        return;
      }

      setStatus("idle");
      pushToast("Event created.", "success");
      form.reset();
      setOpen(false);
      router.refresh();
    } catch (error) {
      setStatus("idle");
      pushToast("Network error. Try again.", "error");
    }
  }

  return (
    <div className="rounded-2xl border border-[#d6dbe7] bg-white p-6 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.25)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
            Create Event
          </p>
          <h3 className="text-lg font-semibold text-[#0f172a]">
            Launch a new experience
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full border border-[#0f172a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0f172a] transition hover:bg-[#0f172a] hover:text-[#f5f7fb]"
        >
          {open ? "Close" : "New"}
        </button>
      </div>

      {open ? (
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-4"
          aria-busy={status === "loading"}
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-[#1f2937]">
            Event name
            <input
              name="name"
              required
              placeholder="Summer Gala"
              className="h-11 rounded-lg border border-[#d6dbe7] bg-[#f8fafc] px-4 text-base text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-[#1f2937]">
              Start date
              <input
                name="startAt"
                type="date"
                required
                className="h-11 rounded-lg border border-[#d6dbe7] bg-[#f8fafc] px-4 text-base text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#1f2937]">
              End date
              <input
                name="endAt"
                type="date"
                required
                className="h-11 rounded-lg border border-[#d6dbe7] bg-[#f8fafc] px-4 text-base text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-[#1f2937]">
            Location
            <input
              name="location"
              placeholder="120 King Street, Brooklyn"
              className="h-11 rounded-lg border border-[#d6dbe7] bg-[#f8fafc] px-4 text-base text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
            />
          </label>
          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-2 flex h-11 items-center justify-center rounded-full bg-[#0f172a] text-xs font-semibold uppercase tracking-[0.3em] text-[#f5f7fb] transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "loading" ? "Creating..." : "Create Event"}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-[#64748b]">
          Add a new event, set its dates, and start building the registration
          flow.
        </p>
      )}
    </div>
  );
}



