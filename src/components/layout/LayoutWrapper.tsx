"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface LayoutWrapperProps {
  user: { id: number; email: string } | null;
  children: React.ReactNode;
}

export default function LayoutWrapper({ user, children }: LayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar
          user={user}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto min-h-0">{children}</main>
      </div>
    </div>
  );
}
