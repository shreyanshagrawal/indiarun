from sqlalchemy import Column, String, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.models.base import Base

class UnitEconomics(Base):
    __tablename__ = "unit_economics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # Raw Inputs
    cac = Column(Numeric, nullable=False, default=0)
    arpu = Column(Numeric, nullable=False, default=0)
    service_delivery_cost = Column(Numeric, nullable=False, default=0)
    customer_lifetime_months = Column(Numeric, nullable=False, default=0)
    
    # Computed Outputs
    gross_margin = Column(Numeric, nullable=False, default=0)
    ltv = Column(Numeric, nullable=False, default=0)
    cac_payback_months = Column(Numeric, nullable=False, default=0)
    ltv_cac_ratio = Column(Numeric, nullable=False, default=0)
    
    # AI Verdict
    verdict = Column(String, nullable=True)
