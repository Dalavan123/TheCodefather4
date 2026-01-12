"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  touched?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, touched, className = "", ...props }, ref) => {
    const showError = error && touched;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium mb-1.5 text-slate-300"
          >
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded border ${
            showError
              ? "border-red-500 focus:ring-red-500"
              : "border-white/10 focus:ring-cyan-500"
          } bg-white/5 px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${className}`}
          aria-invalid={showError ? "true" : "false"}
          aria-describedby={showError ? `${props.id}-error` : undefined}
          {...props}
        />
        {showError && (
          <p
            id={`${props.id}-error`}
            className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
