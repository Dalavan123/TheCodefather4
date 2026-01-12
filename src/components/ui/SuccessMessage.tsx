"use client";

interface SuccessMessageProps {
  message: string;
}

export function SuccessMessage({ message }: SuccessMessageProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="text-center text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg p-3 animate-in fade-in duration-300"
    >
      <span className="font-medium">{message}</span>
    </div>
  );
}
