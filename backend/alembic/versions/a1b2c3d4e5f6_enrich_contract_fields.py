"""enrich contract fields

Revision ID: a1b2c3d4e5f6
Revises: 077a7e8c10ae
Create Date: 2026-05-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '077a7e8c10ae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('contracts', sa.Column('code_fare', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('contracts', sa.Column('contracted_powers_kw', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('contracts', sa.Column('time_discrimination', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('contracts', sa.Column('marketer', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    op.drop_column('contracts', 'marketer')
    op.drop_column('contracts', 'time_discrimination')
    op.drop_column('contracts', 'contracted_powers_kw')
    op.drop_column('contracts', 'code_fare')
