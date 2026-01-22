"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

type InviteSenderProps = {
  eventId: string;
};

type Status = "idle" | "loading" | "success" | "error";

export default function InviteSender({ eventId }: InviteSenderProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = { email: String(formData.get("email") || "").trim() };

    try {
      const response = await fetch(`/api/events/${eventId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setStatus("idle");
        pushToast(data?.error || "Unable to send invite.", "error");
        return;
      }

      setStatus("idle");
      pushToast("Invite sent.", "success");
      form.reset();
      router.refresh();
    } catch (error) {
      setStatus("idle");
      pushToast("Network error. Please try again.", "error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#d6dbe7] bg-white p-6 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.25)]"
      aria-busy={status === "loading"}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
          Send Invite
        </p>
        <h3 className="mt-2 text-lg font-semibold text-[#0f172a]">
          Deliver a registration link
        </h3>
        <p className="mt-2 text-sm text-[#64748b]">
          Invitees will receive a private link and confirmation QR code.
        </p>
      </div>

      <label className="mt-6 flex flex-col gap-2 text-sm font-medium text-[#1f2937]">
        Invitee email
        <input
          name="email"
          type="email"
          required
          placeholder="guest@email.com"
          className="h-11 rounded-lg border border-[#d6dbe7] bg-[#f8fafc] px-4 text-base text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
        />
      </label>

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-[#0f172a] text-xs font-semibold uppercase tracking-[0.3em] text-[#f5f7fb] transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? "Sending..." : "Send Invite"}
      </button>
    </form>
  );
}



