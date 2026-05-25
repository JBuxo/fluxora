import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { LoginForm } from "@/components/sections/login-form";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
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
              id="lg"
              x1="0"
              y1="0"
              x2="1200"
              y2="0"
              gradientUnits="userSpaceOnUse"
              spreadMethod="repeat"
            >
              <stop offset="0%" stopColor="#00DBFB" />
              <stop offset="33%" stopColor="#0132E9" />
              <stop offset="66%" stopColor="#CA2BFA" />
              <stop offset="100%" stopColor="#00DBFB" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                from="1200 0"
                to="0 0"
                dur="6s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>
          {[350, 375, 400, 425, 450].map((y, i) => (
            <path
              key={y}
              d={`M 0,${y - 220} C 200,${y - 60} 500,${y + 110} 700,${y - 70} S 1000,${y + 130} 1200,${y + 220}`}
              fill="none"
              stroke="url(#lg)"
              strokeWidth={1.5 - i * 0.1}
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
        <LoginForm />
      </div>
    </div>
  );
}
