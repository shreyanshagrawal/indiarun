"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, ArrowLeft, ExternalLink, Download, CheckCircle, 
  AlertCircle, Users, Zap, FileText, Package, TrendingUp, BarChart2
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

const STAGES = [
  { key: "brand_brief",    label: "Brand Brief",        icon: Zap,        href: "intake",     color: "text-violet-500" },
  { key: "personas",       label: "Personas",           icon: Users,      href: "definition", color: "text-blue-500" },
  { key: "prd_summary",   label: "PRD",                icon: FileText,   href: "definition", color: "text-sky-500" },
  { key: "prototype",      label: "Prototype",          icon: Package,    href: "prototype",  color: "text-emerald-500" },
  { key: "gtm_plan",       label: "GTM + Economics",   icon: TrendingUp, href: "gtm",        color: "text-orange-500" },
  { key: "tracking",       label: "Tracking Dashboard", icon: BarChart2,  href: "tracking",   color: "text-rose-500" },
];

export default function OverviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth(`/project/${projectId}/overview`);
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  const exportMarkdown = () => {
    if (!data) return;
    const { project, brand_brief, personas, features, prd_summary, prototype, unit_economics, gtm_plan, tracking } = data;
    const lines: string[] = [];

    lines.push(`# ${project.idea_name} — Project Overview`);
    lines.push(`**Type:** ${project.product_type} | **Stage:** ${project.current_stage}\n`);

    lines.push(`## 1. Brand Brief`);
    if (brand_brief) {
      lines.push(brand_brief.whitespace_summary || "_Not generated yet_");
      if (brand_brief.recommended_attributes?.length) {
        lines.push(`\n**Recommended attributes:**`);
        brand_brief.recommended_attributes.forEach((a: string) => lines.push(`- ${a}`));
      }
    } else lines.push("_Not generated yet_");

    lines.push(`\n## 2. Target Personas`);
    if (personas?.length) {
      personas.forEach((p: any) => {
        lines.push(`\n### ${p.name}`);
        lines.push(`> "${p.quote}"`);
        lines.push(`**Goals:** ${p.goals}`);
        lines.push(`**Pain Points:** ${p.pain_points}`);
      });
    } else lines.push("_Not generated yet_");

    lines.push(`\n## 3. Top Features`);
    if (features?.length) {
      features.slice(0, 5).forEach((f: any) => {
        lines.push(`- **${f.title}** (${f.moscow_label}) — ${f.description}`);
      });
    } else lines.push("_Not generated yet_");

    lines.push(`\n## 4. PRD Summary`);
    lines.push(prd_summary || "_Not generated yet_");

    lines.push(`\n## 5. Prototype`);
    if (prototype) {
      lines.push(`**Type:** ${prototype.type}`);
      if (prototype.concept_image_url) lines.push(`**Concept Image:** ${prototype.concept_image_url}`);
    } else lines.push("_Not generated yet_");

    lines.push(`\n## 6. GTM + Unit Economics`);
    if (gtm_plan) {
      lines.push(`**Motion:** ${gtm_plan.gtm_motion}`);
      lines.push(`**Positioning:** ${gtm_plan.positioning}`);
      lines.push(`**Success Metrics:** ${gtm_plan.success_metrics}`);
    }
    if (unit_economics) {
      lines.push(`\n**CAC:** $${unit_economics.cac} | **LTV:** $${unit_economics.ltv} | **Gross Margin:** ${unit_economics.gross_margin}%`);
    }

    lines.push(`\n## 7. Tracking Dashboard`);
    if (tracking?.row_count > 0) {
      lines.push(`**Data Points:** ${tracking.row_count}`);
      lines.push(`**Latest DAU:** ${tracking.latest_dau}`);
      lines.push(`**Latest Retention:** ${tracking.latest_retention}%`);
      lines.push(`**Flagged Anomalies:** ${tracking.anomaly_count}`);
    } else {
      lines.push("_No CSV data uploaded yet_");
    }

    const md = lines.join("\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.idea_name.replace(/\s+/g, "_")}_overview.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Loading project overview...</span>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-muted-foreground">Failed to load overview.</div>;

  const { project, brand_brief, personas, features, prd_summary, prd_approved, prototype, unit_economics, gtm_plan, tracking } = data;

  const stageStatus = {
    brand_brief: !!brand_brief,
    personas: personas?.length > 0,
    prd_summary: !!prd_summary,
    prototype: !!prototype,
    gtm_plan: !!gtm_plan,
    tracking: tracking?.row_count > 0,
  } as Record<string, boolean>;

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="-ml-4 mb-3">
            <ArrowLeft className="mr-2 w-4 h-4" /> Dashboard
          </Button>
          <h1 className="text-4xl font-bold">{project.idea_name}</h1>
          <p className="text-muted-foreground mt-1 capitalize">
            {project.product_type} product · {project.current_stage} stage
          </p>
        </div>
        <Button onClick={exportMarkdown} size="lg" className="gap-2">
          <Download className="w-4 h-4" />
          Export as Markdown
        </Button>
      </div>

      {/* Stage Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {STAGES.map((stage) => {
          const Icon = stage.icon;
          const done = stageStatus[stage.key];
          return (
            <button
              key={stage.key}
              onClick={() => router.push(`/project/${projectId}/${stage.href}`)}
              className={`p-3 rounded-xl border text-left transition-all hover:shadow-md ${done ? 'bg-card border-border' : 'bg-muted/40 border-dashed border-muted-foreground/30'}`}
            >
              <Icon className={`w-5 h-5 mb-2 ${stage.color}`} />
              <p className="text-xs font-semibold leading-tight">{stage.label}</p>
              <p className={`text-xs mt-1 ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                {done ? "✓ Ready" : "Pending"}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Brand Brief */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-500" /> Brand Brief
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push(`/project/${projectId}/intake`)}>
                <ExternalLink className="w-3 h-3" />
              </Button>
            </CardHeader>
            <CardContent>
              {brand_brief ? (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">{brand_brief.whitespace_summary}</p>
                  {brand_brief.recommended_attributes?.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {brand_brief.recommended_attributes.slice(0, 3).map((a: string, i: number) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <span className="text-violet-500 mt-0.5">•</span> {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">Not generated yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Personas */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" /> Target Personas ({personas?.length || 0})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push(`/project/${projectId}/definition`)}>
                <ExternalLink className="w-3 h-3" />
              </Button>
            </CardHeader>
            <CardContent>
              {personas?.length > 0 ? (
                <div className="space-y-4">
                  {personas.slice(0, 2).map((p: any, i: number) => (
                    <div key={i} className="pl-3 border-l-2 border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-semibold">{p.name}</p>
                      {p.quote && <p className="text-xs text-muted-foreground italic mt-0.5">"{p.quote}"</p>}
                      {p.pain_points && <p className="text-xs mt-1 text-muted-foreground">Pain: {String(p.pain_points).slice(0, 120)}</p>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground italic">Not generated yet.</p>}
            </CardContent>
          </Card>

          {/* PRD */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" /> PRD
                {prd_approved && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Approved</span>}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push(`/project/${projectId}/definition`)}>
                <ExternalLink className="w-3 h-3" />
              </Button>
            </CardHeader>
            <CardContent>
              {prd_summary ? (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{prd_summary}</p>
              ) : <p className="text-sm text-muted-foreground italic">Not generated yet.</p>}
            </CardContent>
          </Card>

        </div>

        {/* Side column */}
        <div className="space-y-5">

          {/* Prototype */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-500" /> Prototype
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push(`/project/${projectId}/prototype`)}>
                <ExternalLink className="w-3 h-3" />
              </Button>
            </CardHeader>
            <CardContent>
              {prototype ? (
                <>
                  <p className="text-xs font-medium mb-2 uppercase text-muted-foreground">{prototype.type}</p>
                  {prototype.concept_image_url && (
                    <img src={prototype.concept_image_url} alt="Concept" className="w-full rounded-lg object-cover max-h-40" />
                  )}
                </>
              ) : <p className="text-sm text-muted-foreground italic">Not generated yet.</p>}
            </CardContent>
          </Card>

          {/* Unit Economics */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" /> GTM + Unit Economics
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push(`/project/${projectId}/gtm`)}>
                <ExternalLink className="w-3 h-3" />
              </Button>
            </CardHeader>
            <CardContent>
              {unit_economics ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "CAC", value: `$${unit_economics.cac}` },
                    { label: "LTV", value: `$${unit_economics.ltv}` },
                    { label: "Gross Margin", value: `${unit_economics.gross_margin}%` },
                    { label: "Payback", value: `${unit_economics.payback_period_months}mo` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-bold text-sm">{value ?? "—"}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground italic">Not generated yet.</p>}
              {gtm_plan && (
                <div className="mt-3 pt-3 border-t text-xs">
                  <p className="font-semibold text-muted-foreground">Motion</p>
                  <p>{gtm_plan.gtm_motion}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracking */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-rose-500" /> Tracking
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push(`/project/${projectId}/tracking`)}>
                <ExternalLink className="w-3 h-3" />
              </Button>
            </CardHeader>
            <CardContent>
              {tracking?.row_count > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Data points</span>
                    <span className="font-semibold">{tracking.row_count}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Latest DAU</span>
                    <span className="font-semibold">{tracking.latest_dau?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Retention</span>
                    <span className="font-semibold">{tracking.latest_retention}%</span>
                  </div>
                  {tracking.anomaly_count > 0 && (
                    <div className="mt-2 pt-2 border-t flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {tracking.anomaly_count} anomaly(ies) flagged
                    </div>
                  )}
                </div>
              ) : <p className="text-sm text-muted-foreground italic">No CSV uploaded yet.</p>}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
