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

export interface TempCorrelationPoint {
  month: string;
  consumption: number;
  avg_temp: number | null;
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
  projected_p1_kwh: number;
  projected_p2_kwh: number;
  energy_cost_eur: number;
  power_cost_eur: number;
  cargos_eur: number;
  meter_rent_eur: number;
  iee_eur: number;
  iva_eur: number;
  estimated_bill_eur: number;
  bill_low_eur: number;
  bill_high_eur: number;
  days_remaining: number;
}

export interface ForecastResponse {
  daily: DailyForecast[];
  bill_estimate: BillEstimate;
  last_run_at: string | null;
}

export interface AnomalyPoint {
  date: string;
  actual_kwh: number;
  predicted_kwh: number;
  lower_kwh: number;
  upper_kwh: number;
  residual_kwh: number;
  z_score: number;
  is_anomaly: boolean;
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
  id?: string;
  generated_at: string;
  period: { from: string; to: string; days: number };
  supply_point: { id: string; cups: string; address: string };
  summary: ReportSummary;
  monthly: MonthlyDataPoint[];
  heatmap: HeatmapPoint[];
  tou: ReportTOU;
  suggestions: ReportSuggestion[];
}

export interface SavedReportMeta {
  id: string;
  generated_at: string;
  period_from: string;
  period_to: string;
  period_days: number;
  total_kwh: number;
  record_count: number;
}
