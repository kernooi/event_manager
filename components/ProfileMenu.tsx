"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProfileMenuProps = {
  email: string;
};

export default function ProfileMenu({ email }: ProfileMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d6dbe7] bg-white text-sm font-semibold text-[#0f172a] shadow-sm transition hover:border-[#2563eb]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {email.slice(0, 2).toUpperCase()}
      </button>
      {open ? (
        <div
          className="absolute right-0 mt-3 w-52 rounded-2xl border border-[#d6dbe7] bg-white p-2 text-sm shadow-[0_20px_50px_-30px_rgba(15,23,42,0.65)]"
          role="menu"
        >
          <div className="px-3 py-2 text-xs uppercase tracking-[0.2em] text-[#4c5b78]">
            Signed in
          </div>
          <div className="px-3 pb-2 text-sm font-medium text-[#0f172a]">
            {email}
          </div>
          <div className="h-px bg-[#e2e8f0]" />
          <Link
            href="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex w-full items-center rounded-xl px-3 py-2 text-left text-[#64748b] transition hover:bg-[#f1f5f9]"
          >
            Profile
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="flex w-full items-center rounded-xl px-3 py-2 text-left text-[#64748b] transition hover:bg-[#f1f5f9]"
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center rounded-xl px-3 py-2 text-left font-medium text-[#b91c1c] transition hover:bg-[#fef2f2]"
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}


