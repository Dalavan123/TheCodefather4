"use client";

import Link from "next/link";

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside
      className={`bg-black border-r border-gray-700 text-white transition-all duration-300 ${
        isOpen ? "w-60" : "w-0"
      } overflow-hidden`}
    >
      <div className="p-4">
        <div>
          <h2 className="text-xl font-bold mb-6">Menu</h2>
        </div>

        <nav className="space-y-2">
          
          <Link
            href="/documents"
            className="block hover:bg-gray-800 p-3 rounded"
          >
            Documents
          </Link>
          <Link
            href="/conversations"
            className="block hover:bg-gray-800 p-3 rounded"
          >
            Conversations
          </Link>
        </nav>
      </div>
    </aside>
  );
}
