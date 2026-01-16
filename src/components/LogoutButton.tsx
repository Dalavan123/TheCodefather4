"use client";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className }: LogoutButtonProps) {
  const handleLogout = async () => {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (response.ok) {
      window.location.href = "/login";
    }
  };

  return (
    <button onClick={handleLogout} className={className ?? "hover:underline"}>
      Logout
    </button>
  );
}
