"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    };

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setStatus("error");
        setMessage(data?.error || "Login failed. Try again.");
        return;
      }

      setStatus("success");
      setMessage("Welcome back. You are cleared to continue.");
      router.push("/dashboard");
    } catch (error) {
      setStatus("error");
      setMessage("Network error. Please retry in a moment.");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4efe4] text-[#1b1a18]">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-full">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#f0d9c7] opacity-60 blur-3xl" />
        <div className="absolute right-8 top-16 h-60 w-60 rounded-full bg-[#f8f4ed] opacity-80 blur-2xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-32 rounded-full bg-[#e7cbb8] opacity-70 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:justify-between">
        <section className="flex max-w-xl flex-col gap-6">
          <h1 className="text-4xl font-semibold leading-tight text-[#1b1a18] sm:text-5xl lg:text-6xl font-[var(--font-display)]">
            Events Manager
          </h1>
          <p className="text-lg leading-relaxed text-[#4a3e35]">
            A curated workspace for managing guest lists, invites, and check-ins.
            Accounts are created by the organizer only.
          </p>
          <div className="rounded-2xl border border-[#d7c5b4] bg-white/70 p-6 shadow-[0_20px_60px_-40px_rgba(27,26,24,0.6)] backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a5b48]">
              Access Policy
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#4a3e35]">
              Invite-only access. If you need credentials, contact the event owner
              for a manual account setup.
            </p>
          </div>
        </section>

        <section className="w-full max-w-md rounded-[28px] border border-[#d9c9b9] bg-white px-7 py-8 shadow-[0_30px_70px_-45px_rgba(27,26,24,0.7)] sm:px-9">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[#7a5b48]">
              Member Login
            </p>
            <h2 className="text-2xl font-semibold text-[#1b1a18] font-[var(--font-display)]">
              Sign in to your dashboard
            </h2>
            <p className="text-sm text-[#6b5a4a]">
              Use the email and password provided by the organizer.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <label className="flex flex-col gap-2 text-sm font-medium text-[#3f352c]">
              Email address
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@yourevent.com"
                className="h-12 rounded-xl border border-[#d9c9b9] bg-[#fbf8f2] px-4 text-base text-[#1b1a18] outline-none transition focus:border-[#b35b2e] focus:ring-2 focus:ring-[#e6c1a9]"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#3f352c]">
              Password
              <input
                required
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="h-12 rounded-xl border border-[#d9c9b9] bg-[#fbf8f2] px-4 text-base text-[#1b1a18] outline-none transition focus:border-[#b35b2e] focus:ring-2 focus:ring-[#e6c1a9]"
              />
            </label>

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-2 flex h-12 items-center justify-center rounded-full bg-[#1b1a18] text-sm font-semibold uppercase tracking-[0.25em] text-[#f4efe4] transition hover:bg-[#2a2724] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Authenticating..." : "Enter Workspace"}
            </button>
          </form>

          {message ? (
            <p
              className={`mt-6 rounded-xl px-4 py-3 text-sm ${
                status === "success"
                  ? "bg-[#eff7f1] text-[#21523b]"
                  : "bg-[#fff1ed] text-[#7a3327]"
              }`}
              role="status"
            >
              {message}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
