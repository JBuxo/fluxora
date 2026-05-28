from enum import Enum


class ContractStatus(str, Enum):
    active = "active"
    inactive = "inactive"


class ConsumptionSource(str, Enum):
    datadis = "datadis"
    manual = "manual"


class CredentialStatus(str, Enum):
    active = "active"
    invalid = "invalid"
    expired = "expired"


class SyncStatus(str, Enum):
    pending = "pending"
    running = "running"
    success = "success"
    failed = "failed"


class SyncType(str, Enum):
    supplies = "supplies"
    contracts = "contracts"
    consumption = "consumption"
