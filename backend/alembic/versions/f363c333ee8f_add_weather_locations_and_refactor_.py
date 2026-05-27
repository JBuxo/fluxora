"""add weather_locations and refactor weather_records to location_id

Revision ID: f363c333ee8f
Revises: dc113b0e67b6
Create Date: 2026-05-27 18:34:27.845794

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'f363c333ee8f'
down_revision: Union[str, Sequence[str], None] = 'dc113b0e67b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'weather_locations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('label', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('last_synced_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_weather_locations_latitude', 'weather_locations', ['latitude'])
    op.create_index('ix_weather_locations_longitude', 'weather_locations', ['longitude'])

    op.create_table(
        'weather_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('location_id', sa.Uuid(), nullable=True),
        sa.Column('record_date', sa.Date(), nullable=False),
        sa.Column('temp_max_c', sa.Float(), nullable=True),
        sa.Column('temp_min_c', sa.Float(), nullable=True),
        sa.Column('temp_mean_c', sa.Float(), nullable=True),
        sa.Column('fetched_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_weather_records_location_id', 'weather_records', ['location_id'])
    op.create_index('ix_weather_records_record_date', 'weather_records', ['record_date'])

    op.add_column('homes', sa.Column('weather_location_id', sa.Uuid(), nullable=True))
    op.create_index('ix_homes_weather_location_id', 'homes', ['weather_location_id'])


def downgrade() -> None:
    op.drop_index('ix_homes_weather_location_id', 'homes')
    op.drop_column('homes', 'weather_location_id')
    op.drop_index('ix_weather_records_record_date', table_name='weather_records')
    op.drop_index('ix_weather_records_location_id', table_name='weather_records')
    op.drop_table('weather_records')
    op.drop_index('ix_weather_locations_longitude', table_name='weather_locations')
    op.drop_index('ix_weather_locations_latitude', table_name='weather_locations')
    op.drop_table('weather_locations')
