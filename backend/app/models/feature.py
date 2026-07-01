"""Feature model."""

import uuid
from typing import Optional

from sqlalchemy import ForeignKey, String, text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

class Feature(Base):
    __tablename__ = "features"

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
    
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    reach: Mapped[float] = mapped_column(Numeric, nullable=False)
    impact: Mapped[float] = mapped_column(Numeric, nullable=False)
    confidence: Mapped[float] = mapped_column(Numeric, nullable=False)
    effort: Mapped[Optional[float]] = mapped_column(Numeric, nullable=True)
    rice_score: Mapped[Optional[float]] = mapped_column(Numeric, nullable=True)
    priority_label: Mapped[str] = mapped_column(String, nullable=False)
    moscow_label: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    project = relationship("Project", backref="features")
