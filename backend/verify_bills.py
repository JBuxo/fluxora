
"""
Compares actual electricity bills against consumption records.
Models variable (kWh x rate) + fixed (power charge) components.
"""

import csv
from datetime import datetime, timezone
from pathlib import Path

from app.db.database import engine
from sqlmodel import Session, text

CSV_PATH = Path(__file__).parent.parent / "importe_por_mes.csv"
FORECAST_RATE = 0.19
PEAK_KW = 3.3
VALLEY_KW = 3.3
POWER_RATE_PEAK = 0.102811    # EUR/kW/day CNMC 2.0TD P1
POWER_RATE_VALLEY = 0.047511  # EUR/kW/day CNMC 2.0TD P2


def parse_amount(s):
    return float(s.strip().replace(",", ".").replace('"', ""))


def parse_date(s):
    return datetime.strptime(s.strip(), "%m/%d/%Y").replace(tzinfo=timezone.utc)


def main():
    rows = []
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append({"date": parse_date(row["Dia"]), "actual": parse_amount(row["Importe (€)"])})
    rows.sort(key=lambda r: r["date"])

    with Session(engine) as s:
        print(f"Rate: EUR{FORECAST_RATE}/kWh  |  Power: {PEAK_KW}kW P1 @ EUR{POWER_RATE_PEAK} + {VALLEY_KW}kW P2 @ EUR{POWER_RATE_VALLEY} /kW/day\n")
        hdr = f"{'Period':<27} {'D':>3} {'kWh':>7} {'Actual':>8} {'Variable':>9} {'Fixed':>7} {'Est':>8} {'Diff':>8} {'Diff%':>6}"
        print(hdr)
        print("-" * len(hdr))

        total_actual = total_kwh = total_est = 0.0

        for i in range(1, len(rows)):
            p_start = rows[i - 1]["date"]
            p_end = rows[i]["date"]
            actual = rows[i]["actual"]
            days = (p_end - p_start).days

            row = s.exec(text(
                "SELECT SUM(consumption_kwh) FROM consumption_records "
                "WHERE timestamp >= :a AND timestamp < :b"
            ).bindparams(a=p_start.isoformat(), b=p_end.isoformat())).first()

            kwh = row[0] or 0.0
            variable = kwh * FORECAST_RATE
            fixed = (PEAK_KW * POWER_RATE_PEAK + VALLEY_KW * POWER_RATE_VALLEY) * days
            est = variable + fixed
            diff = est - actual
            pct = (diff / actual * 100) if actual else 0
            flag = " !" if abs(pct) > 20 else "  "

            label = f"{p_start.strftime('%d %b %y')}-{p_end.strftime('%d %b %y')}"
            print(f"{label:<27} {days:>3} {kwh:>7.1f} {actual:>8.2f} {variable:>9.2f} {fixed:>7.2f} {est:>8.2f} {diff:>+8.2f} {pct:>+5.1f}%{flag}")

            total_actual += actual
            total_kwh += kwh
            total_est += est

        print("-" * len(hdr))
        td = total_est - total_actual
        tp = (td / total_actual * 100) if total_actual else 0
        print(f"{'TOTAL':<27} {'':>3} {total_kwh:>7.1f} {total_actual:>8.2f} {'':>9} {'':>7} {total_est:>8.2f} {td:>+8.2f} {tp:>+5.1f}%")


if __name__ == "__main__":
    main()
