from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from app.db.session import get_db
from app.services.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.unit_economics import UnitEconomics
from app.agents.gtm_agents import generate_unit_economics_verdict

router = APIRouter(prefix="/api/project/{project_id}/gtm", tags=["gtm"])

class UnitEconomicsPayload(BaseModel):
    cac: float
    arpu: float
    service_delivery_cost: float
    customer_lifetime_months: float

@router.get("/unit-economics")
async def get_unit_economics(project_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(UnitEconomics).where(UnitEconomics.project_id == project_id))
    ue = result.scalars().first()
    if not ue:
        return {}
        
    return {
        "id": str(ue.id),
        "cac": float(ue.cac),
        "arpu": float(ue.arpu),
        "service_delivery_cost": float(ue.service_delivery_cost),
        "customer_lifetime_months": float(ue.customer_lifetime_months),
        "gross_margin": float(ue.gross_margin),
        "ltv": float(ue.ltv),
        "cac_payback_months": float(ue.cac_payback_months),
        "ltv_cac_ratio": float(ue.ltv_cac_ratio),
        "verdict": ue.verdict
    }

@router.post("/unit-economics")
async def save_unit_economics(project_id: str, payload: UnitEconomicsPayload, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Deterministic Backend Math
    gross_margin = payload.arpu - payload.service_delivery_cost
    ltv = gross_margin * payload.customer_lifetime_months
    cac_payback_months = (payload.cac / gross_margin) if gross_margin > 0 else 9999
    ltv_cac_ratio = (ltv / payload.cac) if payload.cac > 0 else 9999
    
    metrics = {
        "cac": payload.cac,
        "arpu": payload.arpu,
        "service_delivery_cost": payload.service_delivery_cost,
        "customer_lifetime_months": payload.customer_lifetime_months,
        "gross_margin": gross_margin,
        "ltv": ltv,
        "cac_payback_months": round(cac_payback_months, 2),
        "ltv_cac_ratio": round(ltv_cac_ratio, 2)
    }
    
    # 2. LLM Verdict
    verdict = await generate_unit_economics_verdict(metrics)
    
    # 3. Save to DB
    result = await db.execute(select(UnitEconomics).where(UnitEconomics.project_id == project_id))
    ue = result.scalars().first()
    
    if not ue:
        ue = UnitEconomics(project_id=project_id)
        db.add(ue)
        
    ue.cac = payload.cac
    ue.arpu = payload.arpu
    ue.service_delivery_cost = payload.service_delivery_cost
    ue.customer_lifetime_months = payload.customer_lifetime_months
    ue.gross_margin = gross_margin
    ue.ltv = ltv
    ue.cac_payback_months = metrics["cac_payback_months"]
    ue.ltv_cac_ratio = metrics["ltv_cac_ratio"]
    ue.verdict = verdict
    
    await db.commit()
    
    return {
        "id": str(ue.id),
        **metrics,
        "verdict": verdict
    }
