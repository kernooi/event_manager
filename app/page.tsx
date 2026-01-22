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
      setMessage("Authentication confirmed. Redirecting to your dashboard.");
      router.push("/dashboard");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setStatus("error");
      setMessage("Network error. Please retry in a moment.");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f7fb] text-[#0f172a]">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-full">
        <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-[#cbd5f5] opacity-40 blur-[120px]" />
        <div className="absolute right-20 top-0 h-64 w-64 rounded-full bg-[#dbeafe] opacity-60 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-32 rounded-full bg-[#e2e8f0] opacity-70 blur-[140px]" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:justify-between">
        <section className="flex max-w-xl flex-col gap-6">
          <h1 className="font-serif text-4xl font-semibold leading-tight text-[#0f172a] sm:text-5xl lg:text-6xl">
            Event Operations Portal
          </h1>
          <p className="text-lg leading-relaxed text-[#334155]">
            A consolidated workspace for guest credentials, invite governance,
            and real-time check-in oversight across venues.
          </p>
        </section>

        <section className="w-full max-w-md rounded-2xl border border-[#d6dbe7] bg-white px-7 py-8 shadow-[0_14px_30px_-18px_rgba(15,23,42,0.25)] sm:px-9">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-[#0f172a]">
              Sign in
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <label className="flex flex-col gap-2 text-sm font-medium text-[#1f2937]">
              Email address
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                className="h-12 rounded-lg border border-[#d6dbe7] bg-[#f8fafc] px-4 text-base text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#1f2937]">
              Password
              <input
                required
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your secure password"
                className="h-12 rounded-lg border border-[#d6dbe7] bg-[#f8fafc] px-4 text-base text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
              />
            </label>

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-2 flex h-12 items-center justify-center rounded-lg bg-[#0f172a] text-sm font-semibold text-white shadow-[0_10px_22px_-14px_rgba(15,23,42,0.35)] transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Verifying access..." : "Continue to portal"}
            </button>
          </form>

          {message ? (
            <p
              className={`mt-6 rounded-lg px-4 py-3 text-sm ${
                status === "success"
                  ? "bg-[#eff6ff] text-[#1e40af]"
                  : "bg-[#fef2f2] text-[#991b1b]"
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

