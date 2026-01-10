"use client";

interface ToggleSidebarProps {
  onClick: () => void;
}

export default function ToggleSidebar({ onClick }: ToggleSidebarProps) {
  return (
    <button
      onClick={onClick}
      className="text-2xl hover:bg-gray-800 p-2 rounded"
    >
      ☰
    </button>
  );
}
