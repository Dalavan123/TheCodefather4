"use client";

import Link from "next/link";
import ToggleSidebar from "@/components/ToggleSidebar";
import LogoutButton from "@/components/LogoutButton";

interface NavbarProps {
  user: { id: number; email: string } | null;
  onToggleSidebar: () => void;
}

export default function Navbar({ user, onToggleSidebar }: NavbarProps) {
  return (
    <nav className="bg-black text-white border-b border-gray-700 p-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-3 items-center">
          <ToggleSidebar onClick={onToggleSidebar} />
          <div className="flex">
            {user && <span className="font-medium">Välkommen</span>}
          </div>
        </div>

        <div className="flex gap-4">
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
