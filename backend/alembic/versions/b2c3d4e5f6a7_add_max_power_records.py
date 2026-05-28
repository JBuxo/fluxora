"""add max_power_records table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'max_power_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('supply_point_id', sa.Uuid(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('max_power_kw', sa.Float(), nullable=False),
        sa.Column('period', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.ForeignKeyConstraint(['supply_point_id'], ['supply_points.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('supply_point_id', 'timestamp', 'period', name='uq_max_power_supply_ts_period'),
    )
    op.create_index('ix_max_power_records_supply_point_id', 'max_power_records', ['supply_point_id'])
    op.create_index('ix_max_power_records_timestamp', 'max_power_records', ['timestamp'])


def downgrade() -> None:
    op.drop_index('ix_max_power_records_timestamp', table_name='max_power_records')
    op.drop_index('ix_max_power_records_supply_point_id', table_name='max_power_records')
    op.drop_table('max_power_records')
