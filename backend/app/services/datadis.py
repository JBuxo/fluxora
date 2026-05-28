import json
import logging
from datetime import datetime, timedelta

from datadis_python.client.v2.simple_client import SimpleDatadisClientV2

logger = logging.getLogger(__name__)


def fetch_all_supply_data(nif: str, password: str, date_from: str, date_to: str) -> list[dict]:
    """
    Single authenticated session. Returns list of supply dicts with keys:
      contract, consumption_records, max_power_records
    Raises on total failure; partial failures (per supply) are logged and skipped.
    """
    with SimpleDatadisClientV2(nif, password) as client:
        supplies_resp = client.get_supplies()
        if not supplies_resp.supplies:
            raise ValueError("No supplies found for NIF")

        results = []
        for s in supplies_resp.supplies:
            supply = s.model_dump()
            cups = supply["cups"].strip()
            distributor_code = supply["distributor_code"]

            # Contract detail
            contract_data = None
            try:
                contract_resp = client.get_contract_detail(cups=cups, distributor_code=distributor_code)
                if contract_resp.contract:
                    c = contract_resp.contract[0].model_dump()
                    powers = c.get("contracted_power_kw") or []
                    contract_data = {
                        "code_fare": c.get("code_fare"),
                        "contracted_powers_kw": json.dumps(powers),
                        "time_discrimination": c.get("time_discrimination") or None,
                        "marketer": c.get("marketer"),
                        "start_date": c.get("start_date"),
                        "end_date": c.get("end_date"),
                        "access_fare": c.get("access_fare"),
                    }
            except Exception as e:
                logger.warning("Contract fetch failed for %s: %s", cups, e)

            # Consumption records
            consumption_records = []
            try:
                consumption_resp = client.get_consumption(
                    cups=cups,
                    distributor_code=distributor_code,
                    date_from=date_from,
                    date_to=date_to,
                    measurement_type=0,
                    point_type=supply.get("point_type", 5),
                )
                for reg in (consumption_resp.time_curve or []):
                    d = getattr(reg, "date", "")
                    t = getattr(reg, "time", "")
                    kwh = getattr(reg, "consumption", getattr(reg, "consumption_kwh", 0.0))
                    if not d or not t:
                        continue
                    if t == "24:00":
                        ts = datetime.strptime(f"{d} 00:00", "%Y/%m/%d %H:%M") + timedelta(days=1)
                    else:
                        ts = datetime.strptime(f"{d} {t}", "%Y/%m/%d %H:%M")
                    consumption_records.append({"timestamp": ts, "consumption_kwh": kwh})
            except Exception as e:
                logger.warning("Consumption fetch failed for %s: %s", cups, e)

            # Max power records
            max_power_records = []
            try:
                max_power_resp = client.get_max_power(
                    cups=cups,
                    distributor_code=distributor_code,
                    date_from=date_from,
                    date_to=date_to,
                )
                for rec in (max_power_resp.max_power or []):
                    d = getattr(rec, "date", "")
                    t = getattr(rec, "time", "")
                    kw = getattr(rec, "max_power", 0.0)
                    period = str(getattr(rec, "period", ""))
                    if not d or not t:
                        continue
                    ts = datetime.strptime(f"{d} {t}", "%Y/%m/%d %H:%M")
                    # API returns watts, convert to kW
                    max_power_records.append({"timestamp": ts, "max_power_kw": kw / 1000, "period": period})
            except Exception as e:
                logger.warning("Max power fetch failed for %s: %s", cups, e)

            supply["contract"] = contract_data
            supply["consumption_records"] = consumption_records
            supply["max_power_records"] = max_power_records
            results.append(supply)

        return results
