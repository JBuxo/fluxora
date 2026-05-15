export interface ActiveContract {
  id: string;
  tariff_name: string;
  power_kw: number | null;
}

export interface SupplyPointWithContract {
  id: string;
  cups: string;
  address: string;
  active: boolean;
  last_synced_at: string | null;
  active_contract: ActiveContract | null;
}

export interface HomeWithContracts {
  id: string;
  name: string;
  address: string;
  supply_points: SupplyPointWithContract[];
}

export interface ConsumptionSummary {
  total_kwh: number;
  total_cost: number;
  avg_daily_kwh: number;
  trend_pct: number;
  forecasted_monthly_cost: number;
  record_count: number;
}

export interface MonthlyDataPoint {
  month: string;
  consumption: number;
  previous: number;
  cost: number;
}

export interface HeatmapPoint {
  day: number;
  hour: number;
  avg_kwh: number;
  value: number;
}

export interface ReportTOU {
  P1: number;
  P2: number;
  P3: number;
  total: number;
  P1_pct: number;
  P2_pct: number;
  P3_pct: number;
}

export interface ReportSuggestion {
  type: "timing" | "tariff" | "habit";
  headline: string;
  detail: string;
  saving_estimate: string;
}

export interface Report {
  generated_at: string;
  period: { from: string; to: string; days: number };
  supply_point: { id: string; cups: string; address: string };
  summary: ConsumptionSummary;
  monthly: MonthlyDataPoint[];
  heatmap: HeatmapPoint[];
  tou: ReportTOU;
  suggestions: ReportSuggestion[];
}
