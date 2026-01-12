"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { SuccessMessage } from "@/components/ui/SuccessMessage";
import { useForm } from "@/hooks/useForm";
import { validators } from "@/lib/validation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState("");
  const [password, setPassword] = useState("");

  const { fields, isSubmitting, submitError, isValid, handleChange, handleBlur, handleSubmit } =
    useForm({
      initialValues: {
        email: "",
        password: "",
        confirmPassword: "",
      },
      validators: {
        email: validators.email,
        password: (value) => {
          setPassword(value);
          return validators.password(value);
        },
        confirmPassword: (value) => validators.confirmPassword(password, value),
      },
      onSubmit: async (values) => {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: values.email.trim().toLowerCase(),
            password: values.password,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Registrering misslyckades");
        }

        setSuccessMessage("Konto skapat! Omdirigerar till inloggning...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      },
    });

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-slate-900 text-white p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Registrera
          </h1>
          <p className="text-sm text-slate-400 mt-2">Skapa ditt konto </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="email"
            label="E-postadress"
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="namn@exempel.se"
            value={fields.email.value}
            error={fields.email.error}
            touched={fields.email.touched}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
          />

          <PasswordInput
            id="password"
            label="Lösenord"
            required
            autoComplete="new-password"
            placeholder="Minst 6 tecken"
            value={fields.password.value}
            error={fields.password.error}
            touched={fields.password.touched}
            onChange={(e) => handleChange("password", e.target.value)}
            onBlur={() => handleBlur("password")}
          />

          <PasswordInput
            id="confirmPassword"
            label="Bekräfta lösenord"
            required
            autoComplete="new-password"
            placeholder="Ange lösenordet igen"
            value={fields.confirmPassword.value}
            error={fields.confirmPassword.error}
            touched={fields.confirmPassword.touched}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            onBlur={() => handleBlur("confirmPassword")}
          />

          <Button type="submit" isLoading={isSubmitting} disabled={!isValid}>
            Skapa konto
          </Button>
        </form>

        <ErrorMessage message={submitError} />
        <SuccessMessage message={successMessage} />

        <p className="text-center text-sm text-slate-300">
          Har du redan ett konto?{" "}
          <Link
            className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors underline-offset-2 hover:underline"
            href="/login"
          >
            Logga in här
          </Link>
        </p>

        <p className="text-center text-xs text-slate-500">
          🔒 Din information är säker och krypterad
        </p>
      </div>
    </main>
  );
}
