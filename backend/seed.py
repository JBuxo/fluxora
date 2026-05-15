"""
Run from backend/ with venv active:
    python seed.py
"""

import uuid
from datetime import date, datetime, timedelta, timezone
from random import random, uniform

from sqlmodel import Session, SQLModel, delete

from app.db.database import engine
from app.models import (
    ConsumptionRecord,
    Contract,
    DatadisCredential,
    DatadisSyncJob,
    Home,
    SupplyPoint,
    User,
)
from app.models.enums import (
    ConsumptionSource,
    ContractStatus,
    CredentialStatus,
    SyncStatus,
    SyncType,
)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def clear(session: Session) -> None:
    for table in [
        ConsumptionRecord,
        Contract,
        DatadisSyncJob,
        DatadisCredential,
        SupplyPoint,
        Home,
        User,
    ]:
        session.exec(delete(table))
    session.commit()


def seed(session: Session) -> None:
    # ── Users ────────────────────────────────────────────────────────────────
    jose = User(
        id=uuid.uuid4(),
        email="jose@fluxora.dev",
        first_name="Jose",
        last_name="Buxo",
    )
    ana = User(
        id=uuid.uuid4(),
        email="ana@fluxora.dev",
        first_name="Ana",
        last_name="García",
    )
    session.add_all([jose, ana])
    session.flush()

    # ── Homes ─────────────────────────────────────────────────────────────────
    jose_home = Home(
        user_id=jose.id,
        name="Casa Principal",
        address="Calle Mayor 12, 28001 Madrid",
    )
    jose_office = Home(
        user_id=jose.id,
        name="Oficina",
        address="Paseo de la Castellana 89, 28046 Madrid",
    )
    ana_home = Home(
        user_id=ana.id,
        name="Piso Barcelona",
        address="Carrer de Balmes 45, 08007 Barcelona",
    )
    session.add_all([jose_home, jose_office, ana_home])
    session.flush()

    # ── Supply Points (CUPS) ──────────────────────────────────────────────────
    sp1 = SupplyPoint(
        home_id=jose_home.id,
        cups="ES0031300000000001XN",
        address="Calle Mayor 12, 28001 Madrid",
        distributor_name="Endesa Distribución",
        active=True,
        last_synced_at=utcnow() - timedelta(hours=2),
    )
    sp2 = SupplyPoint(
        home_id=jose_office.id,
        cups="ES0031300000000002XN",
        address="Paseo de la Castellana 89, 28046 Madrid",
        distributor_name="Endesa Distribución",
        active=True,
        last_synced_at=utcnow() - timedelta(days=1),
    )
    sp3 = SupplyPoint(
        home_id=ana_home.id,
        cups="ES0227000000000003XN",
        address="Carrer de Balmes 45, 08007 Barcelona",
        distributor_name="Endesa Distribución",
        active=True,
        last_synced_at=utcnow() - timedelta(hours=6),
    )
    session.add_all([sp1, sp2, sp3])
    session.flush()

    # ── Contracts ─────────────────────────────────────────────────────────────
    contracts = [
        Contract(
            supply_point_id=sp1.id,
            contract_number="CTR-2024-001",
            start_date=date(2024, 1, 1),
            end_date=None,
            tariff_name="2.0TD",
            power_kw=5.75,
            status=ContractStatus.active,
        ),
        Contract(
            supply_point_id=sp2.id,
            contract_number="CTR-2023-088",
            start_date=date(2023, 6, 1),
            end_date=None,
            tariff_name="3.0TD",
            power_kw=15.0,
            status=ContractStatus.active,
        ),
        Contract(
            supply_point_id=sp3.id,
            contract_number="CTR-2022-445",
            start_date=date(2022, 3, 15),
            end_date=date(2023, 3, 14),
            tariff_name="2.0TD",
            power_kw=4.6,
            status=ContractStatus.inactive,
        ),
        Contract(
            supply_point_id=sp3.id,
            contract_number="CTR-2023-445",
            start_date=date(2023, 3, 15),
            end_date=None,
            tariff_name="2.0TD",
            power_kw=5.75,
            status=ContractStatus.active,
        ),
    ]
    session.add_all(contracts)
    session.flush()

    # ── Consumption Records (30 days, hourly for sp1; daily for sp2/sp3) ──────
    records = []
    base = utcnow().replace(minute=0, second=0, microsecond=0) - timedelta(days=30)

    # sp1 — hourly, realistic residential pattern
    for hour_offset in range(30 * 24):
        ts = base + timedelta(hours=hour_offset)
        hour = ts.hour
        # low at night, peaks morning/evening
        base_kwh = 0.1 + (0.4 if 7 <= hour <= 9 else 0.0) + (0.5 if 19 <= hour <= 22 else 0.0)
        kwh = round(base_kwh + uniform(0, 0.15), 3)
        records.append(ConsumptionRecord(
            supply_point_id=sp1.id,
            timestamp=ts,
            consumption_kwh=kwh,
            cost_estimate=round(kwh * 0.18 * (1 + random() * 0.2), 4),
            source=ConsumptionSource.datadis,
        ))

    # sp2 — daily office consumption
    for day_offset in range(30):
        ts = base + timedelta(days=day_offset)
        is_weekend = ts.weekday() >= 5
        kwh = round(uniform(1.5, 3.0) if is_weekend else uniform(12.0, 22.0), 3)
        records.append(ConsumptionRecord(
            supply_point_id=sp2.id,
            timestamp=ts,
            consumption_kwh=kwh,
            cost_estimate=round(kwh * 0.17, 4),
            source=ConsumptionSource.datadis,
        ))

    # sp3 — daily residential
    for day_offset in range(30):
        ts = base + timedelta(days=day_offset)
        kwh = round(uniform(3.0, 9.0), 3)
        records.append(ConsumptionRecord(
            supply_point_id=sp3.id,
            timestamp=ts,
            consumption_kwh=kwh,
            cost_estimate=round(kwh * 0.19, 4),
            source=ConsumptionSource.datadis,
        ))

    session.add_all(records)
    session.flush()

    # ── Datadis Credentials (encrypted placeholder) ───────────────────────────
    session.add_all([
        DatadisCredential(
            user_id=jose.id,
            dni_encrypted="enc:v1:aGVsbG8=",
            password_encrypted="enc:v1:d29ybGQ=",
            encryption_key_id="v1",
            status=CredentialStatus.active,
            last_validated_at=utcnow() - timedelta(hours=3),
        ),
        DatadisCredential(
            user_id=ana.id,
            dni_encrypted="enc:v1:dXNlcg==",
            password_encrypted="enc:v1:cGFzcw==",
            encryption_key_id="v1",
            status=CredentialStatus.active,
            last_validated_at=utcnow() - timedelta(days=2),
        ),
    ])

    # ── Sync Jobs ─────────────────────────────────────────────────────────────
    now = utcnow()
    session.add_all([
        DatadisSyncJob(
            user_id=jose.id,
            status=SyncStatus.success,
            type=SyncType.consumption,
            started_at=now - timedelta(hours=2, minutes=5),
            finished_at=now - timedelta(hours=2),
        ),
        DatadisSyncJob(
            user_id=jose.id,
            status=SyncStatus.success,
            type=SyncType.supplies,
            started_at=now - timedelta(days=1),
            finished_at=now - timedelta(days=1) + timedelta(seconds=8),
        ),
        DatadisSyncJob(
            user_id=ana.id,
            status=SyncStatus.failed,
            type=SyncType.consumption,
            error_message="Datadis API timeout after 30s",
            started_at=now - timedelta(hours=6),
            finished_at=now - timedelta(hours=6) + timedelta(seconds=30),
        ),
        DatadisSyncJob(
            user_id=ana.id,
            status=SyncStatus.pending,
            type=SyncType.consumption,
        ),
    ])

    session.commit()
    print("Seeded:")
    print(f"  2 users, 3 homes, 3 supply points")
    print(f"  4 contracts")
    print(f"  {len(records)} consumption records")
    print(f"  2 datadis credentials")
    print(f"  4 sync jobs")


if __name__ == "__main__":
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        print("Clearing existing data...")
        clear(session)
        print("Seeding...")
        seed(session)
