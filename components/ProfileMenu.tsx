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
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d9c9b9] bg-white text-sm font-semibold text-[#1b1a18] shadow-sm transition hover:border-[#b35b2e]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {email.slice(0, 2).toUpperCase()}
      </button>
      {open ? (
        <div
          className="absolute right-0 mt-3 w-52 rounded-2xl border border-[#e3d6c8] bg-white p-2 text-sm shadow-[0_20px_50px_-30px_rgba(27,26,24,0.8)]"
          role="menu"
        >
          <div className="px-3 py-2 text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
            Signed in
          </div>
          <div className="px-3 pb-2 text-sm font-medium text-[#1b1a18]">
            {email}
          </div>
          <div className="h-px bg-[#f1e7dc]" />
          <Link
            href="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex w-full items-center rounded-xl px-3 py-2 text-left text-[#5b4a3d] transition hover:bg-[#f8f1e8]"
          >
            Profile
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="flex w-full items-center rounded-xl px-3 py-2 text-left text-[#5b4a3d] transition hover:bg-[#f8f1e8]"
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center rounded-xl px-3 py-2 text-left font-medium text-[#8b2f2f] transition hover:bg-[#fff1ed]"
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
