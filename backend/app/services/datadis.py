from datetime import datetime

from datadis_python.client.v2.simple_client import SimpleDatadisClientV2


def fetch_supplies(nif: str, password: str) -> list[dict]:
    with SimpleDatadisClientV2(nif, password) as client:
        resp = client.get_supplies()
        if not resp.supplies:
            raise ValueError("No supplies found for NIF")
        return [s.model_dump() for s in resp.supplies]


def fetch_consumption(nif: str, password: str, cups: str, distributor_code: str, date_from: str, date_to: str) -> list[dict]:
    with SimpleDatadisClientV2(nif, password) as client:
        resp = client.get_consumption(
            cups=cups,
            distributor_code=distributor_code,
            date_from=date_from,
            date_to=date_to,
            measurement_type=0,
            point_type=5,
        )
        records = []
        for reg in (resp.time_curve or []):
            date = getattr(reg, "date", "")
            time = getattr(reg, "time", "")
            kwh = getattr(reg, "consumption", getattr(reg, "consumption_kwh", 0.0))
            if date and time:
                ts = datetime.strptime(f"{date} {time}", "%Y/%m/%d %H:%M")
                records.append({"timestamp": ts, "consumption_kwh": kwh})
        return records
