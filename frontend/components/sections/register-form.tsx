"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "../ui/field";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";

const GRAD = "linear-gradient(135deg, #CA2BFA 0%, #0132E9 50%, #00DBFB 100%)";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <Card className={cn("flex flex-col gap-6 p-6", className)} {...props}>
      <form>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link href="/home" className="flex flex-col items-center gap-2">
              <Image src="/logo.png" alt="Fluxora" width={36} height={36} />
            </Link>
            <h1 className="text-xl font-bold">Crea tu cuenta en Fluxora</h1>
            <FieldDescription>
              Te enviaremos un enlace mágico para acceder.{" "}
              <Link href="/login" className="underline underline-offset-4">
                ¿Ya tienes cuenta?
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
            />
          </Field>

          <Field>
            <Button
              type="submit"
              className="w-full border-transparent text-white font-semibold hover:opacity-90 transition-opacity"
              style={{ background: GRAD }}
            >
              Enviar enlace mágico
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
