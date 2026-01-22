"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

type Status = "idle" | "loading" | "success" | "error";

type ProfileEmailFormProps = {
  initialEmail: string;
};

export default function ProfileEmailForm({ initialEmail }: ProfileEmailFormProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [savedEmail, setSavedEmail] = useState(initialEmail);
  const [status, setStatus] = useState<Status>("idle");

  const normalizedEmail = email.trim().toLowerCase();
  const isUnchanged = normalizedEmail === savedEmail;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    if (!normalizedEmail) {
      setStatus("idle");
      pushToast("Email is required.", "error");
      return;
    }

    if (isUnchanged) {
      setStatus("idle");
      pushToast("Email is already up to date.", "info");
      return;
    }

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setStatus("idle");
        pushToast(data?.error || "Unable to update email.", "error");
        return;
      }

      setStatus("idle");
      pushToast("Email updated.", "success");
      setEmail(normalizedEmail);
      setSavedEmail(normalizedEmail);
      router.refresh();
    } catch (error) {
      setStatus("idle");
      pushToast("Network error. Please try again.", "error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex flex-col gap-4"
      aria-busy={status === "loading"}
    >
      <label className="flex flex-col gap-2 text-sm font-medium text-[#1f2937]">
        Sign-in email
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 rounded-xl border border-[#d6dbe7] bg-[#f8fafc] px-4 text-base text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
        />
      </label>

      <button
        type="submit"
        disabled={status === "loading" || !normalizedEmail || isUnchanged}
        className="flex h-11 items-center justify-center rounded-full bg-[#0f172a] text-xs font-semibold uppercase tracking-[0.3em] text-[#f5f7fb] transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? "Saving..." : "Save email"}
      </button>
    </form>
  );
}

