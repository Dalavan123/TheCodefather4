"use client";

import Link from "next/link";
import Image from "next/image";
import ToggleSidebar from "@/components/ToggleSidebar";
import LogoutButton from "@/components/LogoutButton";

interface NavbarProps {
  user: { id: number; email: string } | null;
  onToggleSidebar: () => void;
}

export default function Navbar({ user, onToggleSidebar }: NavbarProps) {
  const displayName = user?.email.split("@")[0];

  return (
    <nav className="bg-black text-white border-b border-gray-700 p-4">
      <div className="flex justify-between items-center">
        {/* LEFT */}
        <div className="flex gap-4 items-center">
          <ToggleSidebar onClick={onToggleSidebar} />

          {/* LOGO + TITLE */}
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

          {/* USER INFO */}
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300 hidden md:block">
                Välkommen
              </span>

              {/* badge */}
              <span className="text-sm font-medium px-2.5 py-1 rounded-full border border-gray-700 bg-gray-900 text-gray-200">
                {displayName ?? user.email}
              </span>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">
          {user ? (
            <LogoutButton />
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Login
              </Link>
              <Link href="/register" className="hover:underline">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
