"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

  const linkBase = "block p-3 rounded transition-colors";

  const active = "bg-gray-800 text-white font-medium";

  const inactive = "text-gray-300 hover:bg-gray-800";

  return (
    <aside
      className={`bg-black border-r border-gray-700 text-white transition-all duration-300 ${
        isOpen ? "w-60" : "w-0"
      } overflow-hidden`}
    >
      <div className="p-4">
        <h2 className="text-xl font-bold mb-6">Meny</h2>

        <nav className="space-y-2">
          <Link
            href="/documents"
            className={`${linkBase} ${
              pathname.startsWith("/documents") ? active : inactive
            }`}
          >
            Dokument
          </Link>

          <Link
            href="/conversations"
            className={`${linkBase} ${
              pathname.startsWith("/conversations") ? active : inactive
            }`}
          >
            Konversationer
          </Link>
          <Link href="/devops" className="block hover:bg-gray-800 p-3 rounded">
             DevOps
          </Link>
        </nav>
      </div>
    </aside>
  );
}
