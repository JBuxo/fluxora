import { Badge } from "@/components/ui/badge";
import { Clock, Tag, Repeat2 } from "lucide-react";
import type { ReportSuggestion } from "@/lib/types/api";

const TYPE_CONFIG = {
  timing: { label: "Timing", Icon: Clock },
  tariff: { label: "Tariff", Icon: Tag },
  habit: { label: "Habit", Icon: Repeat2 },
};

export function ReportSuggestions({ suggestions }: { suggestions: ReportSuggestion[] }) {
  return (
    <div className="space-y-3">
      {suggestions.map((s, i) => {
        const { label, Icon } = TYPE_CONFIG[s.type];
        return (
          <div key={i} className="flex gap-4 rounded-lg border p-4">
            <div className="flex-1 space-y-1">
              <Badge variant="outline" className="gap-1 text-xs">
                <Icon className="h-3 w-3" />
                {label}
              </Badge>
              <p className="font-medium leading-snug">{s.headline}</p>
              <p className="text-sm text-muted-foreground">{s.detail}</p>
            </div>
            {s.saving_estimate !== "—" && (
              <div className="shrink-0 text-right">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Potential saving</p>
                <p className="font-mono text-lg font-bold">{s.saving_estimate}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
