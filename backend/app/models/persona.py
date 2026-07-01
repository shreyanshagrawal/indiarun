"""Persona model."""

import uuid
from typing import List

from sqlalchemy import ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

class Persona(Base):
    __tablename__ = "personas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    name: Mapped[str] = mapped_column(String, nullable=False)
    quote: Mapped[str] = mapped_column(String, nullable=False)
    demographics: Mapped[dict] = mapped_column(JSONB, nullable=False)
    goals: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=False)
    pain_points: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=False)
    scenario: Mapped[str] = mapped_column(String, nullable=False)

    project = relationship("Project", backref="personas")
