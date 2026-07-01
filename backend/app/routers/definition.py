from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid
from typing import List, Dict, Any

from app.db.session import get_db
from app.models.project import Project
from app.models.intake_brief import IntakeBrief
from app.models.brand_brief import BrandBrief
from app.models.persona import Persona
from app.models.feature import Feature
from app.models.prd import PRD
from app.agents.definition_agents import generate_personas, generate_features, generate_prd

router = APIRouter(prefix="/api/project/{project_id}", tags=["definition"])

@router.post("/brand_brief")
async def create_brand_brief(project_id: uuid.UUID, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    result = await db.execute(select(BrandBrief).filter(BrandBrief.project_id == project_id))
    brief = result.scalars().first()
    if brief:
        await db.delete(brief)
        
    brief = BrandBrief(
        project_id=project_id,
        whitespace_summary=data.get("whitespace_summary", "Manual testing summary"),
        psychographic_target=data.get("psychographic_target", {}),
        approved=True
    )
    db.add(brief)
    
    project.current_stage = "definition"
    await db.commit()
    await db.refresh(brief)
    
    return {"status": "ok", "id": brief.id}

@router.post("/definition/generate")
async def generate_definition(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.id == project_id))
    project = result.scalars().first()
    
    result = await db.execute(select(IntakeBrief).filter(IntakeBrief.project_id == project_id))
    intake = result.scalars().first()
    
    result = await db.execute(select(BrandBrief).filter(BrandBrief.project_id == project_id))
    brand = result.scalars().first()
    
    if not intake or not brand:
        raise HTTPException(status_code=400, detail="Missing intake or brand brief")
        
    intake_dict = {
        "problem_statement": intake.problem_statement,
        "target_user": intake.target_user,
        "product_type": project.product_type,
        "known_competitors": intake.known_competitors,
    }
    
    brand_dict = {
        "whitespace_summary": brand.whitespace_summary,
        "psychographic_target": brand.psychographic_target
    }
    
    # 1. Personas
    personas_data = generate_personas(intake_dict, brand_dict)
    
    result = await db.execute(select(Persona).filter(Persona.project_id == project_id))
    for p in result.scalars().all():
        await db.delete(p)
        
    for p in personas_data:
        db.add(Persona(
            project_id=project_id,
            name=p["name"],
            quote=p["quote"],
            demographics=p["demographics"],
            goals=p["goals"],
            pain_points=p["pain_points"],
            scenario=p["scenario"]
        ))
    await db.commit()
    
    # 2. Features
    features_data = generate_features(intake_dict, personas_data)
    
    result = await db.execute(select(Feature).filter(Feature.project_id == project_id))
    for f in result.scalars().all():
        await db.delete(f)
        
    for f in features_data:
        reach = f.get("reach", 5)
        impact = f.get("impact", 5)
        confidence = f.get("confidence", 0.5)
        effort = 1.0 # Default effort to compute RICE
        
        rice_score = (reach * impact * confidence) / effort
        
        if rice_score >= 80: priority = "very_high"
        elif rice_score >= 50: priority = "high"
        elif rice_score >= 20: priority = "medium"
        else: priority = "low"
        
        db.add(Feature(
            project_id=project_id,
            title=f["title"],
            description=f["description"],
            reach=reach,
            impact=impact,
            confidence=confidence,
            effort=effort,
            rice_score=rice_score,
            priority_label=priority
        ))
    await db.commit()
    
    # 3. PRD
    prd_markdown = generate_prd(intake_dict, brand_dict, personas_data, features_data)
    
    result = await db.execute(select(PRD).filter(PRD.project_id == project_id))
    prd = result.scalars().first()
    
    if prd:
        prd.content_markdown = prd_markdown
    else:
        db.add(PRD(
            project_id=project_id,
            content_markdown=prd_markdown
        ))
    await db.commit()
    
    return {"status": "ok"}

@router.get("/definition")
async def get_definition(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Persona).filter(Persona.project_id == project_id))
    personas = result.scalars().all()
    
    result = await db.execute(select(Feature).filter(Feature.project_id == project_id))
    features = result.scalars().all()
    
    result = await db.execute(select(PRD).filter(PRD.project_id == project_id))
    prd = result.scalars().first()
    
    return {
        "personas": personas,
        "features": features,
        "prd": prd.content_markdown if prd else ""
    }
