"""add weather_records and home lat_lon

Revision ID: dc113b0e67b6
Revises: b513f0a91c59
Create Date: 2026-05-27 18:22:28.900440

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dc113b0e67b6'
down_revision: Union[str, Sequence[str], None] = 'b513f0a91c59'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # weather_records and home lat/lon are handled together in f363c333ee8f
    pass


def downgrade() -> None:
    pass
