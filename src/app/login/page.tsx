"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useForm } from "@/hooks/useForm";
import { validators } from "@/lib/validation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;

        if (data?.user?.id) {
          router.replace("/documents");
        }
      } catch {
        // om det failar: gör inget, visa login som vanligt
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  const {
    fields,
    isSubmitting,
    submitError,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validators: {
      email: validators.email,
      password: validators.password,
    },
    onSubmit: async values => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email.trim().toLowerCase(),
          password: values.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Fel e-postadress eller lösenord");
      }

      router.push("/documents");
      router.refresh();
    },
  });

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-slate-900 text-white p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Logga in
          </h1>
          <p className="text-sm text-slate-400 mt-2">Välkommen tillbaka!</p>
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
            onChange={e => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
          />

          <PasswordInput
            id="password"
            label="Lösenord"
            required
            autoComplete="current-password"
            placeholder="Ange ditt lösenord"
            value={fields.password.value}
            error={fields.password.error}
            touched={fields.password.touched}
            onChange={e => handleChange("password", e.target.value)}
            onBlur={() => handleBlur("password")}
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors underline-offset-2 hover:underline"
            >
              Glömt lösenord?
            </Link>
          </div>

          <Button type="submit" isLoading={isSubmitting} disabled={!isValid}>
            Logga in
          </Button>
        </form>

        <ErrorMessage message={submitError} />

        <p className="text-center text-sm text-slate-300">
          Inget konto?{" "}
          <Link
            className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors underline-offset-2 hover:underline"
            href="/register"
          >
            Registrera dig här
          </Link>
        </p>

        <p className="text-center text-xs text-slate-500">
          🔒 Din information är säker och krypterad
        </p>
      </div>
    </main>
  );
}
