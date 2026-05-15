"use client";

import { Clock, Tag, Repeat2, ThumbsUp, X, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type TipType = "timing" | "tariff" | "habit";
type Saving = { amount: string; label: string };

interface Tip {
  id: string;
  type: TipType;
  headline: string;
  detail: string;
  saving: Saving;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
// All inferences are based solely on hourly consumption totals — no appliance-
// level tracking. We can observe *when* usage is high or low, not what's causing it.

const tips: Tip[] = [
  {
    id: "01",
    type: "timing",
    headline: "Most of your evening usage falls in the most expensive hours",
    detail:
      "Between 5pm and 9pm your consumption is consistently at its highest — and that window is when energy costs the most. Shifting even a portion of that usage to after 11pm, when rates drop by around 30%, could make a noticeable difference to your bill.",
    saving: { amount: "~€14", label: "saved per month" },
  },
  {
    id: "02",
    type: "tariff",
    headline: "A time-of-use tariff would suit how you already use energy",
    detail:
      "Your overnight and midday consumption is relatively low, and your usage naturally concentrates in specific windows. A time-of-use tariff rewards that kind of pattern — you'd pay less during the hours you're already quieter, without needing to change anything.",
    saving: { amount: "~€22", label: "saved per month" },
  },
  {
    id: "03",
    type: "habit",
    headline: "Your weekend consumption runs about 40% higher than weekdays",
    detail:
      "Every weekend, your hourly averages are noticeably higher than on weekdays — particularly in the afternoon. We can't tell what's driving it, but it's consistent enough to be worth being aware of if you're trying to bring the bill down.",
    saving: { amount: "~€8", label: "saved per month" },
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const typeConfig: Record<
  TipType,
  {
    label: string;
    icon: React.ElementType;
    rail: string;
    badge: string;
    saving: string;
  }
> = {
  timing: {
    label: "Timing",
    icon: Clock,
    rail: "bg-primary",
    badge: "text-primary border-border bg-accent",
    saving: "text-primary",
  },
  tariff: {
    label: "Tariff",
    icon: Tag,
    rail: "bg-primary",
    badge: "text-primary border-border bg-accent",
    saving: "text-primary",
  },
  habit: {
    label: "Habit",
    icon: Repeat2,
    rail: "bg-primary",
    badge: "text-primary border-border bg-accent",
    saving: "text-primary",
  },
};

// ─── Row ──────────────────────────────────────────────────────────────────────

function TipRow({ tip, isLast }: { tip: Tip; isLast: boolean }) {
  const cfg = typeConfig[tip.type];
  const Icon = cfg.icon;

  return (
    <>
      <div className="group relative flex items-start gap-6 py-6 transition-colors hover:bg-muted/30 -mx-4 px-4 rounded-md">
        {/* Left accent rail */}
        <div
          className={cn(
            "absolute left-0 top-0 w-0.75 rounded-full transition-all duration-300 group-hover:h-full",
            cfg.rail,
          )}
          style={{ height: 0 }}
          aria-hidden
        />

        {/* Index */}
        <span className="w-8 shrink-0 select-none font-mono text-sm tabular-nums text-muted-foreground mt-0.5">
          {tip.id}
        </span>

        {/* Body */}
        <div className="min-w-0 flex-1 space-y-2">
          <Badge variant="outline" className={cfg.badge}>
            <Icon className="h-3 w-3" />
            {cfg.label}
          </Badge>

          <p className="text-lg leading-snug text-foreground">{tip.headline}</p>

          <p className="text-sm leading-relaxed text-muted-foreground max-w-prose">
            {tip.detail}
          </p>

          <div>
            <Button variant="ghost" className="gap-2 text-xs">
              <ThumbsUp className="h-3.5 w-3.5" />
              I&apos;m already doing this
            </Button>
            <Button variant="ghost" className="gap-2 text-xs">
              <ChevronRight className="h-3.5 w-3.5" />
              Show me the data
            </Button>
            <Button
              variant="ghost"
              className="gap-2 text-xs text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Not useful for me
            </Button>
          </div>
        </div>

        {/* Potential saving */}
        <div className="shrink-0 text-right">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Potential saving
          </p>
          <p
            className={cn(
              "font-mono text-xl font-bold tabular-nums leading-none",
              cfg.saving,
            )}
          >
            {tip.saving.amount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground leading-tight max-w-20 ml-auto">
            {tip.saving.label}
          </p>
        </div>
      </div>

      {!isLast && <Separator />}
    </>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function RecommendationEngine() {
  const totalSaving = "~€44";

  return (
    <section className="space-y-4">
      <p className="text-xl tabular-nums leading-none text-foreground">
        Potential Savings: {totalSaving}
      </p>

      <div className="relative">
        {tips.map((tip, i) => (
          <TipRow key={tip.id} tip={tip} isLast={i === tips.length - 1} />
        ))}
      </div>
    </section>
  );
}
