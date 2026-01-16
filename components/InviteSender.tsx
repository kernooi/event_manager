"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type InviteSenderProps = {
  eventId: string;
  onInviteSent?: (invite: InviteSummary) => void;
};

type Status = "idle" | "loading" | "success" | "error";

type InviteSummary = {
  id: string;
  email: string | null;
  status: "CREATED" | "SENT" | "USED";
  createdAt: string;
  usedAt: string | null;
};

export default function InviteSender({
  eventId,
  onInviteSent,
}: InviteSenderProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

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
        setStatus("error");
        setMessage(data?.error || "Unable to send invite.");
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | { invite?: InviteSummary }
        | null;

      setStatus("success");
      setMessage("Invite queued. Email sending.");
      form.reset();

      if (data?.invite && onInviteSent) {
        onInviteSent(data.invite);
      } else {
        router.refresh();
      }
    } catch (error) {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
          Send Invite
        </p>
        <h3 className="mt-2 text-lg font-semibold text-[#1b1a18]">
          Deliver a registration link
        </h3>
        <p className="mt-2 text-sm text-[#6b5a4a]">
          Invitees will receive a private link and confirmation QR code.
        </p>
      </div>

      <label className="mt-6 flex flex-col gap-2 text-sm font-medium text-[#3f352c]">
        Invitee email
        <input
          name="email"
          type="email"
          required
          placeholder="guest@email.com"
          className="h-11 rounded-xl border border-[#d9c9b9] bg-[#fbf8f2] px-4 text-base text-[#1b1a18] outline-none transition focus:border-[#b35b2e] focus:ring-2 focus:ring-[#e6c1a9]"
        />
      </label>

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-[#1b1a18] text-xs font-semibold uppercase tracking-[0.3em] text-[#f4efe4] transition hover:bg-[#2a2724] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? "Sending..." : "Send Invite"}
      </button>

      {message ? (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            status === "error"
              ? "bg-[#fff1ed] text-[#7a3327]"
              : "bg-[#eff7f1] text-[#21523b]"
          }`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
