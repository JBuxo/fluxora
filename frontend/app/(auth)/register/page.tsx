import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { RegisterForm } from "@/components/sections/register-form";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg
          className="w-full h-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient
              id="rg"
              x1="0"
              y1="0"
              x2="1200"
              y2="0"
              gradientUnits="userSpaceOnUse"
              spreadMethod="repeat"
            >
              <stop offset="0%" stopColor="#CA2BFA" />
              <stop offset="33%" stopColor="#0132E9" />
              <stop offset="66%" stopColor="#00DBFB" />
              <stop offset="100%" stopColor="#CA2BFA" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                from="0 0"
                to="1200 0"
                dur="4s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>
          {[350, 375, 400, 425, 450].map((y, i) => (
            <path
              key={y}
              d={`M 0,${y + 250} C 250,${y + 120} 450,${y - 100} 650,${y + 80} S 950,${y - 120} 1200,${y - 250}`}
              fill="none"
              stroke="url(#rg)"
              strokeWidth={1.5 - i * 0.2}
            />
          ))}
        </svg>
      </div>
      <Button asChild variant="ghost">
        <Link href="/home" className="fixed top-4 left-4">
          <ArrowLeftIcon className="size-4" />
          Inicio
        </Link>
      </Button>

      <div className="relative w-full max-w-sm">
        <RegisterForm />
      </div>
    </div>
  );
}
