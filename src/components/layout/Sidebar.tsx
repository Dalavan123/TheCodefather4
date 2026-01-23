"use client";

import Link from "next/link";

interface SidebarProps {
  isOpen: boolean;
}

const SIDEBAR_TEXT = {
  title: "Meny",
  assistant: "Dokumentassistent",
  documents: "Dokument",
  conversations: "Konversationer",
};

export default function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside
      className={`bg-black border-r border-gray-700 text-white transition-all duration-300 ${
        isOpen ? "w-60" : "w-0"
      } overflow-hidden`}
    >
      <div className="p-4">
        <h2 className="text-xl font-bold mb-6">{SIDEBAR_TEXT.title}</h2>

        <nav className="space-y-2">
          <span className="block p-3 rounded text-gray-300">
            {SIDEBAR_TEXT.assistant}
          </span>

          <Link
            href="/documents"
            className="block hover:bg-gray-800 p-3 rounded"
          >
            {SIDEBAR_TEXT.documents}
          </Link>

          <Link
            href="/conversations"
            className="block hover:bg-gray-800 p-3 rounded"
          >
            {SIDEBAR_TEXT.conversations}
          </Link>
        </nav>
      </div>
    </aside>
  );
}
