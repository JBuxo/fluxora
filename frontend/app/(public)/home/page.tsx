import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Activity,
  ArrowRight,
  Plug,
} from "lucide-react";

/* kept only for SVG attributes — not usable as Tailwind */
const SVG_PURPLE = "#CA2BFA";
const SVG_BLUE = "#0132E9";
const SVG_CYAN = "#00DBFB";

const features = [
  {
    icon: Plug,
    title: "Sincronización Datadis",
    description:
      "Conecta tu distribuidora en segundos. Datos reales de consumo actualizados automáticamente, sin fricción.",
    badge: "Automático",
  },
  {
    icon: Activity,
    title: "Mapa de Calor",
    description:
      "Visualiza cuándo consumes más energía, hora a hora, día a día. Patrones ocultos al descubierto.",
    badge: "Visual",
  },
  {
    icon: AlertTriangle,
    title: "Detección de Anomalías",
    description:
      "IA que detecta picos inusuales antes de que llegue tu factura. Alertas basadas en tu propio histórico.",
    badge: "IA",
  },
  {
    icon: TrendingUp,
    title: "Tendencias de Consumo",
    description:
      "Gráficos mensuales que muestran tu evolución. Compara periodos y anticipa el futuro con confianza.",
    badge: "Analítica",
  },
  {
    icon: Lightbulb,
    title: "Recomendaciones",
    description:
      "Sugerencias personalizadas para reducir tu factura, generadas a partir de tus propios datos de uso.",
    badge: "Smart",
  },
  {
    icon: BarChart3,
    title: "Coste Acumulado",
    description:
      "Rastrea el coste total mes a mes con precisión milimétrica. Nunca más te sorprenda una factura de la luz.",
    badge: "Finanzas",
  },
];

const steps = [
  {
    number: "01",
    icon: Plug,
    title: "Conecta Datadis",
    description:
      "Vincula tu distribuidora eléctrica con un clic. Soportamos todas las principales distribuidoras de España.",
  },
  {
    number: "02",
    icon: BarChart3,
    title: "Analiza tu Consumo",
    description:
      "Explora dashboards interactivos con tus datos reales. Mapas de calor, tendencias y anomalías detectadas por IA.",
  },
  {
    number: "03",
    icon: Lightbulb,
    title: "Ahorra Energía",
    description:
      "Actúa sobre las recomendaciones personalizadas y ve cómo tu consumo —y tu factura— se reducen.",
  },
];

const stats = [
  { value: "500,000+", label: "kWh analizados" },
  { value: "94%", label: "anomalías detectadas" },
  { value: "18%", label: "ahorro medio" },
];

/* brand gradient — used in style props where Tailwind can't reach */
const GRAD = "linear-gradient(135deg, #CA2BFA 0%, #0132E9 50%, #00DBFB 100%)";
const GRAD_SOFT =
  "linear-gradient(135deg, rgba(202,43,250,0.09) 0%, rgba(1,50,233,0.09) 50%, rgba(0,219,251,0.09) 100%)";

export default function Home() {
  return (
    <>
      <style>{`
        @keyframes slow-drift {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(-20px, 12px) scale(1.04); }
          66%  { transform: translate(14px, -18px) scale(0.97); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes wave-scroll {
          0%   { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -300; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-1 { animation: fade-up 0.75s ease both; }
        .anim-2 { animation: fade-up 0.75s 0.14s ease both; }
        .anim-3 { animation: fade-up 0.75s 0.28s ease both; }
        .anim-4 { animation: fade-up 0.75s 0.42s ease both; }
        .wave-line {
          stroke-dasharray: 40 20;
          animation: wave-scroll 6s linear infinite;
        }
        .orb   { animation: slow-drift 14s ease-in-out infinite; filter: blur(80px); }
        .orb-2 { animation: slow-drift 18s 4s ease-in-out infinite; filter: blur(100px); }
        .feat-wrap {
          padding: 1px;
          border-radius: 1rem;
          background: rgba(0,0,0,0.07);
          transition: background 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
          cursor: default;
        }
        .feat-wrap:hover {
          background: linear-gradient(135deg, #CA2BFA 0%, #0132E9 50%, #00DBFB 100%);
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(1,50,233,0.12), 0 2px 8px rgba(0,0,0,0.06);
        }
      `}</style>

      <div className="min-h-screen bg-white text-gray-900 antialiased">
        {/* ── Nav ── */}
        <div className="fixed top-5 inset-x-0 z-50 flex justify-center px-6">
          <nav
            className="w-full max-w-7xl rounded-2xl backdrop-blur-md border shadow-[0_2px_20px_rgba(1,50,233,0.05),0_1px_4px_rgba(0,0,0,0.04)] border-blue-900/[0.08]"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,244,255,0.88) 50%, rgba(245,255,255,0.90) 100%)",
            }}
          >
            <div className="px-6 h-14 flex items-center justify-between">
              <Link href="/home" className="flex items-center gap-3">
                <Image src="/logo.png" alt="Fluxora" width={28} height={28} />
                <span className="font-bold text-[15px] tracking-tight text-gray-900">
                  Fluxora
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-900"
                  >
                    Iniciar sesión
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="border-transparent text-white font-semibold hover:opacity-90 transition-opacity"
                    style={{ background: GRAD }}
                  >
                    Empezar gratis
                  </Button>
                </Link>
              </div>
            </div>
          </nav>
        </div>

        {/* ── Hero ── */}
        <section
          className="relative min-h-screen flex items-center overflow-hidden pt-28"
          style={{
            backgroundImage: [
              "radial-gradient(ellipse 80% 60% at 60% 40%, rgba(0,219,251,0.10) 0%, transparent 70%)",
              "radial-gradient(ellipse 60% 50% at 80% 70%, rgba(1,50,233,0.08) 0%, transparent 70%)",
              "radial-gradient(ellipse 50% 40% at 20% 60%, rgba(202,43,250,0.07) 0%, transparent 70%)",
            ].join(", "),
          }}
        >
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div
            className="orb absolute top-1/4 right-1/4 w-[700px] h-[500px] rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse, rgba(0,219,251,0.13) 0%, transparent 70%)",
            }}
          />
          <div
            className="orb-2 absolute bottom-1/4 left-1/3 w-[500px] h-[400px] rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse, rgba(202,43,250,0.09) 0%, transparent 70%)",
            }}
          />

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg
              className="absolute right-0 top-0 h-full w-3/5 opacity-[0.07]"
              viewBox="0 0 700 800"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={SVG_PURPLE} />
                  <stop offset="50%" stopColor={SVG_BLUE} />
                  <stop offset="100%" stopColor={SVG_CYAN} />
                </linearGradient>
              </defs>
              {Array.from({ length: 8 }, (_, i) => {
                const y = 80 + i * 90;
                const amp = 55 - i * 3;
                return (
                  <path
                    key={i}
                    d={`M -100 ${y} C 100 ${y - amp}, 250 ${y + amp}, 350 ${y} S 500 ${y - amp}, 700 ${y} S 900 ${y + amp}, 1100 ${y}`}
                    fill="none"
                    stroke="url(#wg)"
                    strokeWidth={1.5 - i * 0.1}
                    className="wave-line"
                    style={{ animationDelay: `${i * 0.6}s` }}
                  />
                );
              })}
            </svg>
          </div>

          <div className="relative mx-auto max-w-7xl px-8 pb-40 pt-30">
            <div className="max-w-3xl">
              <h1 className="anim-2 text-[clamp(3rem,7vw,5.5rem)] font-black leading-[0.95] tracking-tight mb-8">
                <span className="text-gray-900">Control total</span>
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: GRAD }}
                >
                  sobre tu energía.
                </span>
              </h1>

              <p className="anim-3 text-xl text-gray-500 leading-relaxed max-w-xl mb-12">
                Conecta tu distribuidora, detecta anomalías con IA y reduce tu
                factura. La analítica energética que los hogares españoles
                necesitaban.
              </p>

              <div className="anim-4 flex flex-wrap gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="border-transparent text-white font-bold h-12 px-8 text-[15px] hover:opacity-90 transition-opacity"
                    style={{ background: GRAD }}
                  >
                    Empieza gratis
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-8 text-[15px] text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-300"
                  >
                    Iniciar sesión
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <div className="border-y border-gray-100 bg-gray-50">
          <div className="mx-auto max-w-7xl px-8 py-16">
            <div className="grid grid-cols-3 divide-x divide-gray-200">
              {stats.map((s) => (
                <div key={s.label} className="px-12 text-center">
                  <div
                    className="text-5xl font-black tabular-nums mb-2 bg-clip-text text-transparent"
                    style={{ backgroundImage: GRAD }}
                  >
                    {s.value}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-widest font-medium">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Features ── */}
        <section className="py-40">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-20">
              <Badge
                className="mb-6 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 border-0 text-[#0132E9]"
                style={{ background: GRAD_SOFT }}
              >
                Funcionalidades
              </Badge>
              <h2 className="text-5xl font-black text-gray-900 leading-tight">
                Todo lo que necesitas
                <br />
                <span className="text-gray-300">para dominar tu consumo.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="feat-wrap">
                    <Card className="bg-white border-0 shadow-none rounded-[15px] h-full">
                      <CardHeader className="pb-4 pt-6 px-7">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                          style={{ background: GRAD_SOFT }}
                        >
                          <Icon
                            size={20}
                            className="text-[#0132E9]"
                            strokeWidth={1.75}
                          />
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-[15px] font-bold text-gray-900 leading-snug">
                            {f.title}
                          </CardTitle>
                          <Badge
                            className="text-[10px] font-semibold uppercase tracking-wider shrink-0 border-0 px-2.5 text-[#0132E9]"
                            style={{ background: GRAD_SOFT }}
                          >
                            {f.badge}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="px-7 pb-7">
                        <CardDescription className="text-sm text-gray-400 leading-relaxed">
                          {f.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="relative py-24 bg-gray-50 border-y border-gray-100 overflow-hidden">
          {/* full-bleed background wave lines with moving gradient */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <svg
              className="w-full h-full"
              viewBox="0 0 1200 300"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <linearGradient
                  id="sl-grad"
                  x1="0"
                  y1="0"
                  x2="1200"
                  y2="0"
                  gradientUnits="userSpaceOnUse"
                  spreadMethod="repeat"
                >
                  <stop offset="0%" stopColor={SVG_PURPLE} />
                  <stop offset="33%" stopColor={SVG_BLUE} />
                  <stop offset="66%" stopColor={SVG_CYAN} />
                  <stop offset="100%" stopColor={SVG_PURPLE} />
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
              {[90, 110, 150, 190, 210].map((y, i) => (
                <path
                  key={y}
                  d={`M 0,${y} C 200,${y - 20} 400,${y + 300} 600,${y} S 1000,${y - 20} 1200,${y}`}
                  fill="none"
                  stroke="url(#sl-grad)"
                  strokeWidth={1.5 - i * 0.2}
                />
              ))}
            </svg>
          </div>

          <div className="relative mx-auto max-w-7xl px-8">
            <div className="mb-16">
              <Badge
                className="mb-6 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 border-0 text-[#0132E9]"
                style={{ background: GRAD_SOFT }}
              >
                Cómo funciona
              </Badge>
              <h2 className="text-5xl font-black text-gray-900 leading-tight">
                Tres pasos.
                <br />
                <span className="text-gray-300">Sin complicaciones.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-start">
              {steps.map((step, i) => {
                const Icon = step.icon;
                const stagger = ["mt-0", "mt-10", "mt-20"][i];
                return (
                  <div
                    key={step.number}
                    className={`relative group ${stagger}`}
                  >
                    <div
                      className="relative rounded-2xl p-px overflow-hidden"
                      style={{ background: GRAD_SOFT }}
                    >
                      <div className="relative bg-white rounded-[15px] px-8 py-10 overflow-hidden h-full">
                        <span
                          className="absolute -top-4 -right-2 text-[9rem] font-black leading-none select-none pointer-events-none bg-clip-text text-transparent opacity-[0.07]"
                          style={{ backgroundImage: GRAD }}
                        >
                          {step.number}
                        </span>
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm mb-7"
                          style={{ background: GRAD }}
                        >
                          <Icon
                            size={18}
                            className="text-white"
                            strokeWidth={1.75}
                          />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-40">
          <div className="mx-auto max-w-7xl px-8">
            <div
              className="relative rounded-3xl overflow-hidden p-24 text-center text-white"
              style={{ background: GRAD }}
            >
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />
              <div className="absolute top-0 right-0 w-[500px] h-[400px] rounded-full blur-[100px] opacity-30 pointer-events-none bg-[#00DBFB]" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full blur-[80px] opacity-20 pointer-events-none bg-[#CA2BFA]" />

              <div className="relative">
                <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-8">
                  Empieza hoy
                </p>
                <h2 className="text-5xl md:text-7xl font-black leading-tight mb-8">
                  Tu factura puede ser
                  <br />
                  un 18% menor.
                </h2>
                <p className="text-white/70 text-xl mb-12 max-w-md mx-auto leading-relaxed">
                  Únete a los hogares que ya controlan su energía con Fluxora.
                  Gratis para empezar.
                </p>
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-white text-gray-900 font-bold h-14 px-12 text-base hover:bg-white/90 transition-all shadow-lg hover:shadow-xl"
                  >
                    Crear cuenta gratis
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-gray-100 py-12">
          <div className="mx-auto max-w-7xl px-8 flex items-center justify-between">
            <Link href="/home" className="flex items-center gap-3">
              <Image src="/logo.png" alt="Fluxora" width={24} height={24} />
              <span className="font-bold text-sm text-gray-400">Fluxora</span>
            </Link>
            <p className="text-xs text-gray-300">
              © 2026 Fluxora. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
