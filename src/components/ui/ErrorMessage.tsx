"use client";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="text-center text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3 animate-in fade-in duration-300"
    >
      <span className="font-medium">{message}</span>
    </div>
  );
}
