"""Overview endpoint — aggregates all 6 stage artifacts for a project."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.user import User
from app.models.project import Project
from app.models.brand_brief import BrandBrief
from app.models.persona import Persona
from app.models.feature import Feature
from app.models.prd import PRD
from app.models.prototype import Prototype
from app.models.unit_economics import UnitEconomics
from app.models.gtm_plan import GtmPlan
from app.models.tracking_metrics import TrackingMetric
from app.models.feedback_loop_event import FeedbackLoopEvent
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/project/{project_id}/overview", tags=["overview"])

@router.get("")
async def get_overview(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns all 6 stage artifacts as a single pitch-ready payload."""

    # 0. Project
    p_res = await db.execute(select(Project).where(Project.id == project_id))
    project = p_res.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 1. Brand Brief (whitespace)
    bb_res = await db.execute(select(BrandBrief).where(BrandBrief.project_id == project_id))
    brand_brief = bb_res.scalars().first()

    # 2. Personas
    ps_res = await db.execute(select(Persona).where(Persona.project_id == project_id))
    personas = ps_res.scalars().all()

    # 3. Features + PRD
    ft_res = await db.execute(select(Feature).where(Feature.project_id == project_id))
    features = ft_res.scalars().all()

    prd_res = await db.execute(select(PRD).where(PRD.project_id == project_id))
    prd = prd_res.scalars().first()

    # 4. Prototype
    pt_res = await db.execute(select(Prototype).where(Prototype.project_id == project_id))
    prototype = pt_res.scalars().first()

    # 5. GTM
    ue_res = await db.execute(select(UnitEconomics).where(UnitEconomics.project_id == project_id))
    ue = ue_res.scalars().first()

    gp_res = await db.execute(select(GtmPlan).where(GtmPlan.project_id == project_id))
    gtm_plan = gp_res.scalars().first()

    # 6. Tracking
    tm_res = await db.execute(
        select(TrackingMetric).where(TrackingMetric.project_id == project_id).order_by(TrackingMetric.date.asc())
    )
    metrics = tm_res.scalars().all()

    fl_res = await db.execute(
        select(FeedbackLoopEvent).where(FeedbackLoopEvent.project_id == project_id)
    )
    feedback_events = fl_res.scalars().all()

    return {
        "project": {
            "id": str(project.id),
            "idea_name": project.idea_name,
            "product_type": project.product_type,
            "current_stage": project.current_stage,
            "status": project.status,
        },
        "brand_brief": {
            "whitespace_summary": brand_brief.whitespace_summary,
            "price_tier_map": brand_brief.price_tier_map,
            "psychographic_target": brand_brief.psychographic_target,
            "recommended_attributes": brand_brief.recommended_attributes,
            "approved": brand_brief.approved,
            "version": getattr(brand_brief, 'version', 1),
        } if brand_brief else None,
        "personas": [
            {
                "name": p.name,
                "quote": p.quote,
                "demographics": p.demographics,
                "goals": p.goals,
                "pain_points": p.pain_points,
            }
            for p in personas
        ],
        "features": [
            {
                "title": f.title,
                "description": f.description,
                "priority_label": f.priority_label,
                "moscow_label": f.moscow_label,
                "rice_score": float(f.rice_score) if f.rice_score else None,
            }
            for f in features
        ],
        "prd_summary": (prd.content_markdown or "")[:600] if prd else None,
        "prd_approved": prd.approved if prd else False,
        "prototype": {
            "type": prototype.type,
            "concept_image_url": prototype.concept_image_url,
            "preview_url": prototype.preview_url,
        } if prototype else None,
        "unit_economics": {
            "cac": float(ue.cac) if ue and ue.cac else None,
            "ltv": float(ue.ltv) if ue and ue.ltv else None,
            "gross_margin": float(ue.gross_margin) if ue and ue.gross_margin else None,
            "payback_period_months": float(ue.payback_period_months) if ue and ue.payback_period_months else None,
        } if ue else None,
        "gtm_plan": {
            "objective": gtm_plan.objective,
            "target_market": gtm_plan.target_market,
            "gtm_motion": gtm_plan.gtm_motion,
            "positioning": gtm_plan.positioning,
            "key_differentiators": gtm_plan.key_differentiators,
            "success_metrics": gtm_plan.success_metrics,
        } if gtm_plan else None,
        "tracking": {
            "row_count": len(metrics),
            "latest_date": metrics[-1].date.isoformat() if metrics else None,
            "latest_dau": metrics[-1].dau if metrics else None,
            "latest_retention": float(metrics[-1].retention_rate) if metrics else None,
            "anomaly_count": len(feedback_events),
            "anomalies_sent_to_discovery": sum(1 for e in feedback_events if e.sent_to_discovery),
        },
    }
