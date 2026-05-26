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
  mtd_kwh: number;
  mtd_cost: number;
  avg_daily_kwh: number;
  vs_last_month_pct: number;
  record_count: number;
}

export interface MonthlyDataPoint {
  month: string;
  consumption: number;
  previous: number | null;
  cost: number;
}

export interface HeatmapPoint {
  day: number;
  hour: number;
  avg_kwh: number;
  value: number;
}

export interface DailyForecast {
  date: string;
  predicted_kwh: number;
  lower_kwh: number;
  upper_kwh: number;
}

export interface BillEstimate {
  mtd_actual_kwh: number;
  projected_remaining_kwh: number;
  total_projected_kwh: number;
  energy_rate_kwh: number;
  variable_cost_eur: number;
  fixed_cost_eur: number | null;
  estimated_bill_eur: number;
  days_remaining: number;
}

export interface ForecastResponse {
  daily: DailyForecast[];
  bill_estimate: BillEstimate;
  last_run_at: string | null;
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

export interface ReportSummary {
  total_kwh: number;
  total_cost: number;
  avg_daily_kwh: number;
  trend_pct: number;
  forecasted_monthly_cost: number;
  record_count: number;
}

export interface Report {
  generated_at: string;
  period: { from: string; to: string; days: number };
  supply_point: { id: string; cups: string; address: string };
  summary: ReportSummary;
  monthly: MonthlyDataPoint[];
  heatmap: HeatmapPoint[];
  tou: ReportTOU;
  suggestions: ReportSuggestion[];
}
