"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

type Status = "idle" | "loading" | "success" | "error";

export default function PasswordChangeForm() {
  const { pushToast } = useToast();
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword") || "");
    const newPassword = String(formData.get("newPassword") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (newPassword.length < 8) {
      setStatus("idle");
      pushToast("New password must be at least 8 characters.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("idle");
      pushToast("Passwords do not match.", "error");
      return;
    }

    if (newPassword === currentPassword) {
      setStatus("idle");
      pushToast("New password must be different.", "error");
      return;
    }

    try {
      const response = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setStatus("idle");
        pushToast(data?.error || "Unable to update password.", "error");
        return;
      }

      setStatus("idle");
      pushToast("Password updated.", "success");
      form.reset();
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
      <label className="flex flex-col gap-2 text-sm font-medium text-[#3f352c]">
        Current password
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 rounded-xl border border-[#d9c9b9] bg-[#fbf8f2] px-4 text-base text-[#1b1a18] outline-none transition focus:border-[#b35b2e] focus:ring-2 focus:ring-[#e6c1a9]"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-[#3f352c]">
        New password
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          className="h-11 rounded-xl border border-[#d9c9b9] bg-[#fbf8f2] px-4 text-base text-[#1b1a18] outline-none transition focus:border-[#b35b2e] focus:ring-2 focus:ring-[#e6c1a9]"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-[#3f352c]">
        Confirm new password
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="h-11 rounded-xl border border-[#d9c9b9] bg-[#fbf8f2] px-4 text-base text-[#1b1a18] outline-none transition focus:border-[#b35b2e] focus:ring-2 focus:ring-[#e6c1a9]"
        />
      </label>

      <button
        type="submit"
        disabled={status === "loading"}
        className="flex h-11 items-center justify-center rounded-full bg-[#1b1a18] text-xs font-semibold uppercase tracking-[0.3em] text-[#f4efe4] transition hover:bg-[#2a2724] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? "Saving..." : "Update password"}
      </button>
    </form>
  );
}
