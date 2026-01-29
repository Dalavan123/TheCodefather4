"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ToggleSidebar from "@/components/ToggleSidebar";
import LogoutButton from "@/components/LogoutButton";

interface NavbarProps {
  user: { id: number; email: string } | null;
  onToggleSidebar: () => void;
}

export default function Navbar({ user, onToggleSidebar }: NavbarProps) {
  const displayName = user?.email.split("@")[0] ?? "Konto";
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Stäng dropdown vid klick utanför + Escape
  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <nav className="bg-black text-white border-b border-gray-700 p-4">
      <div className="flex justify-between items-center">
        {/* LEFT */}
        <div className="flex gap-4 items-center">
          <ToggleSidebar onClick={onToggleSidebar} />

          <Link href="/" className="flex items-center gap-3 hover:opacity-90">
            <Image
              src="/logo.png"
              alt="The Codefathers"
              width={36}
              height={36}
              className="rounded"
              priority
            />
            <span className="font-semibold tracking-wide hidden sm:block">
              The Codefathers
            </span>
          </Link>
        </div>

        {/* RIGHT */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className={[
              "px-3 py-1.5 rounded-full text-sm flex items-center gap-2",
              "border transition",
              user
                ? "bg-cyan-500/10 border-cyan-400/40 hover:bg-cyan-500/15 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]"
                : "bg-gray-800 border-gray-700 hover:bg-gray-700",
            ].join(" ")}
            aria-haspopup="menu"
            aria-expanded={open}
            title={user ? `Inloggad som ${user.email}` : "Inte inloggad"}
          >
            {/* status-dot */}
            <span
              className={[
                "inline-block h-2 w-2 rounded-full",
                user ? "bg-emerald-400" : "bg-gray-500",
              ].join(" ")}
              aria-hidden="true"
            />

            <span className="max-w-[140px] truncate">{displayName}</span>

            {/* liten label */}
            <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-full border opacity-90">
              {user ? (
                <span className="border-cyan-400/30 text-cyan-200">
                  Inloggad
                </span>
              ) : (
                <span className="border-gray-600 text-gray-300">Gäst</span>
              )}
            </span>

            <span className="opacity-70">▾</span>
          </button>

          {open && (
            <div
              className="
                absolute right-0 mt-2 w-52
                rounded-md border border-gray-700
                bg-gray-900 shadow-lg
                overflow-hidden
              "
              role="menu"
            >
              {user ? (
                <>
                  <div className="px-4 py-3 border-b border-gray-800">
                    <div className="text-xs text-gray-400">Inloggad som</div>
                    <div className="text-sm truncate">{user.email}</div>
                  </div>

                  <LogoutButton className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-800" />
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-800"
                >
                  Logga in
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
