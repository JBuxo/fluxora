"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Tag, Repeat2, ThumbsUp, X, ChevronRight, TrendingUp, AlertTriangle, CloudRain, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useRecommendations } from "@/hooks/use-recommendations";
import type { Recommendation } from "@/lib/types/api";

// ─── Type config ─────────────────────────────────────────────────────────────

const typeConfig: Record<
  string,
  { label: string; icon: React.ElementType; rail: string; badge: string; saving: string }
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
  forecast: {
    label: "Forecast",
    icon: TrendingUp,
    rail: "bg-primary",
    badge: "text-primary border-border bg-accent",
    saving: "text-primary",
  },
  anomaly: {
    label: "Alert",
    icon: AlertTriangle,
    rail: "bg-destructive",
    badge: "text-destructive border-border bg-accent",
    saving: "text-destructive",
  },
  appliance: {
    label: "Appliance",
    icon: Zap,
    rail: "bg-primary",
    badge: "text-primary border-border bg-accent",
    saving: "text-primary",
  },
  weather: {
    label: "Weather",
    icon: CloudRain,
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

const fallbackConfig = typeConfig.timing;

// ─── Row ─────────────────────────────────────────────────────────────────────

function RecommendationRow({
  rec,
  index,
  isLast,
  onFeedback,
  dismissed,
  homeId,
}: {
  rec: Recommendation;
  index: number;
  isLast: boolean;
  onFeedback: (action: string) => void;
  dismissed: boolean;
  homeId: string | null;
}) {
  const cfg = typeConfig[rec.type] ?? fallbackConfig;
  const Icon = cfg.icon;
  const router = useRouter();

  if (dismissed) return null;

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
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Body */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cfg.badge}>
              <Icon className="h-3 w-3" />
              {cfg.label}
            </Badge>
            {rec.confidence === "high" && (
              <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                High confidence
              </Badge>
            )}
          </div>

          <p className="text-lg leading-snug text-foreground">{rec.title}</p>

          <p className="text-sm leading-relaxed text-muted-foreground max-w-prose">
            {rec.detail}
          </p>

          <div>
            <Button
              variant="ghost"
              className="gap-2 text-xs"
              onClick={() => onFeedback("already_doing")}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              I&apos;m already doing this
            </Button>
            <Button
              variant="ghost"
              className="gap-2 text-xs"
              onClick={() =>
                router.push(
                  `/suggestion/${rec.id}${homeId ? `?homeId=${homeId}` : ""}`
                )
              }
            >
              <ChevronRight className="h-3.5 w-3.5" />
              Show me the data
            </Button>
            <Button
              variant="ghost"
              className="gap-2 text-xs text-muted-foreground"
              onClick={() => onFeedback("not_useful")}
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
          <p className={cn("font-mono text-xl font-bold tabular-nums leading-none", cfg.saving)}>
            {rec.potential_saving_eur > 0 ? `~€${Math.round(rec.potential_saving_eur)}` : "—"}
          </p>
          {rec.potential_saving_eur > 0 && (
            <p className="mt-1 text-xs text-muted-foreground leading-tight max-w-20 ml-auto">
              saved per month
            </p>
          )}
        </div>
      </div>

      {!isLast && <Separator />}
    </>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RecommendationSkeleton() {
  return (
    <div className="space-y-0">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="flex items-start gap-6 py-6 -mx-4 px-4">
            <div className="w-8 h-4 bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-24 bg-muted rounded animate-pulse" />
              <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            </div>
            <div className="shrink-0 w-16 space-y-2">
              <div className="h-3 w-full bg-muted rounded animate-pulse" />
              <div className="h-6 w-full bg-muted rounded animate-pulse" />
            </div>
          </div>
          {i < 3 && <Separator />}
        </div>
      ))}
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

export function RecommendationEngine({ homeId }: { homeId: string | null }) {
  const { recommendations, totalSaving, loading, submitFeedback } = useRecommendations(homeId);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleFeedback = (rec: Recommendation, action: string) => {
    submitFeedback(rec.id, rec.type, action, rec.supporting_data);
    if (action === "not_useful" || action === "dismissed") {
      setDismissed((prev) => new Set([...prev, rec.id]));
    }
  };

  const visible = recommendations.filter((r) => !dismissed.has(r.id));

  if (loading) {
    return <RecommendationSkeleton />;
  }

  if (!loading && visible.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6">
        No recommendations right now — consumption looks normal. Check back after the next forecast run.
      </p>
    );
  }

  return (
    <section className="space-y-4">
      {totalSaving > 0 && (
        <p className="text-xl tabular-nums leading-none text-foreground">
          Potential Savings: ~€{Math.round(totalSaving)}/month
        </p>
      )}

      <div className="relative">
        {recommendations.map((rec, i) => (
          <RecommendationRow
            key={rec.id}
            rec={rec}
            index={i}
            isLast={i === visible.length - 1}
            onFeedback={(action) => handleFeedback(rec, action)}
            dismissed={dismissed.has(rec.id)}
            homeId={homeId}
          />
        ))}
      </div>
    </section>
  );
}
