"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const GRAD = "linear-gradient(135deg, #CA2BFA 0%, #0132E9 50%, #00DBFB 100%)";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <Card
        className={cn("flex flex-col gap-4 p-6 text-center", className)}
        {...props}
      >
        <p className="font-semibold">¡Enlace enviado!</p>
        <p className="text-sm text-muted-foreground">
          Revisa tu correo y haz clic en el enlace para acceder.
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col gap-6 p-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link href="/home" className="flex flex-col items-center gap-2">
              <Image src="/logo.png" alt="Fluxora" width={36} height={36} />
            </Link>
            <h1 className="text-xl font-bold">Accede a Fluxora</h1>
            <FieldDescription>
              Te enviaremos un enlace mágico para acceder.{" "}
              <Link href="/register" className="underline underline-offset-4">
                ¿No tienes cuenta?
              </Link>
            </FieldDescription>
          </div>

          <Field>
            <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Field>
            <Button
              type="submit"
              disabled={loading}
              className="w-full border-transparent text-white font-semibold hover:opacity-90 transition-opacity"
              style={{ background: GRAD }}
            >
              {loading ? "Enviando..." : "Enviar enlace mágico"}
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <FieldDescription className="px-6 text-center">
        Al continuar aceptas nuestros{" "}
        <a href="#" className="underline underline-offset-4">
          Términos de servicio
        </a>{" "}
        y{" "}
        <a href="#" className="underline underline-offset-4">
          Política de privacidad
        </a>
        .
      </FieldDescription>
    </Card>
  );
}
