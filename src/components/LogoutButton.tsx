"use client";

export default function LogoutButton() {
  const handleLogout = async () => {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (response.ok) {
      window.location.href = "/login";
    }
  };

  return (
    <button onClick={handleLogout} className="hover:underline">
      Logout
    </button>
  );
}
