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
      className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]"
      aria-busy={status === "loading"}
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
    </form>
  );
}
