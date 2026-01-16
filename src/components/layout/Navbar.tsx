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
            onClick={() => setOpen(v => !v)}
            className="px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 text-sm flex items-center gap-2"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            {displayName} <span className="opacity-70">▾</span>
          </button>

          {open && (
            <div
              className="
                absolute right-0 mt-2 w-44
                rounded-md border border-gray-600
                bg-gray-800 shadow-lg
                overflow-hidden
              "
              role="menu"
            >
              {/* liten pil */}
              <div className="absolute -top-2 right-4 h-4 w-4 rotate-45 bg-gray-800 border-l border-t border-gray-600" />

              {user ? (
                <LogoutButton className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700" />
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
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
