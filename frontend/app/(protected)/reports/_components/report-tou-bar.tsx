import type { ReportTOU } from "@/lib/types/api";

const PERIODS = [
  { key: "P1" as const, label: "P1 Peak", color: "var(--chart-3)" },
  { key: "P2" as const, label: "P2 Shoulder", color: "var(--chart-2)" },
  { key: "P3" as const, label: "P3 Off-peak", color: "var(--chart-1)" },
];

export function ReportTouBar({ tou }: { tou: ReportTOU }) {
  return (
    <div className="space-y-3">
      <div className="flex h-6 w-full overflow-hidden rounded-md">
        {PERIODS.map(({ key, color }) => (
          <div
            key={key}
            className="h-full"
            style={{ width: `${tou[`${key}_pct`]}%`, background: color }}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        {PERIODS.map(({ key, label, color }) => (
          <div key={key} className="space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: color }} />
              <span className="text-muted-foreground">{label}</span>
            </div>
            <div className="font-semibold">{tou[`${key}_pct`]}%</div>
            <div className="text-muted-foreground">{tou[key].toFixed(1)} kWh</div>
          </div>
        ))}
      </div>
    </div>
  );
}
