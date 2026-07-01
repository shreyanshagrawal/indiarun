"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, BarChart, Save, Sparkles } from "lucide-react";
import { fetchWithAuth, API_BASE_URL } from "@/lib/api";

export default function GTMPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Raw Inputs
  const [cac, setCac] = useState<number>(0);
  const [arpu, setArpu] = useState<number>(0);
  const [serviceDeliveryCost, setServiceDeliveryCost] = useState<number>(0);
  const [customerLifetimeMonths, setCustomerLifetimeMonths] = useState<number>(0);
  
  // Computed Outputs
  const [grossMargin, setGrossMargin] = useState<number>(0);
  const [ltv, setLtv] = useState<number>(0);
  const [cacPaybackMonths, setCacPaybackMonths] = useState<number>(0);
  const [ltvCacRatio, setLtvCacRatio] = useState<number>(0);
  
  // Verdict
  const [verdict, setVerdict] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Client-side live recompute
  useEffect(() => {
    const margin = arpu - serviceDeliveryCost;
    const computedLtv = margin * customerLifetimeMonths;
    const payback = margin > 0 ? (cac / margin) : 9999;
    const ratio = cac > 0 ? (computedLtv / cac) : 9999;
    
    setGrossMargin(margin);
    setLtv(computedLtv);
    setCacPaybackMonths(Number(payback.toFixed(2)));
    setLtvCacRatio(Number(ratio.toFixed(2)));
  }, [cac, arpu, serviceDeliveryCost, customerLifetimeMonths]);

  const fetchData = async () => {
    try {
      const data = await fetchWithAuth(`/project/${projectId}/gtm/unit-economics`);
      if (data && data.id) {
        setCac(data.cac);
        setArpu(data.arpu);
        setServiceDeliveryCost(data.service_delivery_cost);
        setCustomerLifetimeMonths(data.customer_lifetime_months);
        setVerdict(data.verdict);
      }
    } catch (e) {
      console.error("Failed to load unit economics:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("token") || "";
    try {
      const response = await fetch(`${API_BASE_URL}/api/project/${projectId}/gtm/unit-economics`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cac,
          arpu,
          service_delivery_cost: serviceDeliveryCost,
          customer_lifetime_months: customerLifetimeMonths
        })
      });
      if (!response.ok) throw new Error("Failed to save unit economics");
      
      const savedData = await response.json();
      // Update state with backend truth
      setGrossMargin(savedData.gross_margin);
      setLtv(savedData.ltv);
      setCacPaybackMonths(savedData.cac_payback_months);
      setLtvCacRatio(savedData.ltv_cac_ratio);
      setVerdict(savedData.verdict);
      
    } catch (e) {
      console.error(e);
      alert("Failed to analyze viability.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Loading Unit Economics...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <Button variant="ghost" onClick={() => router.push(`/project/${projectId}/prototype`)} className="mb-6 -ml-4">
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Prototype
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">GTM & Unit Economics</h1>
        <p className="text-muted-foreground mt-2">
          Calculate the baseline financial viability of your product idea.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <BarChart className="w-5 h-5 mr-2 text-primary" />
              Raw Inputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Customer Acquisition Cost (CAC) $</Label>
              <Input 
                type="number" 
                value={cac} 
                onChange={(e) => setCac(Number(e.target.value))} 
                min={0}
              />
              <p className="text-xs text-muted-foreground">Cost to acquire one paying customer.</p>
            </div>
            <div className="space-y-2">
              <Label>Average Revenue Per User (ARPU) $</Label>
              <Input 
                type="number" 
                value={arpu} 
                onChange={(e) => setArpu(Number(e.target.value))} 
                min={0}
              />
              <p className="text-xs text-muted-foreground">Monthly revenue expected per user.</p>
            </div>
            <div className="space-y-2">
              <Label>Service Delivery Cost (COGS) $</Label>
              <Input 
                type="number" 
                value={serviceDeliveryCost} 
                onChange={(e) => setServiceDeliveryCost(Number(e.target.value))} 
                min={0}
              />
              <p className="text-xs text-muted-foreground">Monthly cost to serve one user.</p>
            </div>
            <div className="space-y-2">
              <Label>Customer Lifetime (Months)</Label>
              <Input 
                type="number" 
                value={customerLifetimeMonths} 
                onChange={(e) => setCustomerLifetimeMonths(Number(e.target.value))} 
                min={0}
              />
              <p className="text-xs text-muted-foreground">How many months a user typically stays active.</p>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {saving ? "Analyzing..." : "Save & Analyze Viability"}
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card className="border bg-slate-50 dark:bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-lg">Computed Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-950 p-4 rounded-md border shadow-sm flex flex-col justify-center">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Gross Margin</span>
                  <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    ${grossMargin.toFixed(2)}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-950 p-4 rounded-md border shadow-sm flex flex-col justify-center">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Lifetime Value (LTV)</span>
                  <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    ${ltv.toFixed(2)}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-950 p-4 rounded-md border shadow-sm flex flex-col justify-center">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">CAC Payback</span>
                  <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    {cacPaybackMonths === 9999 ? "∞" : cacPaybackMonths} mos
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-950 p-4 rounded-md border shadow-sm flex flex-col justify-center">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">LTV:CAC Ratio</span>
                  <span className={`text-2xl font-bold ${ltvCacRatio >= 3 ? 'text-green-600' : 'text-amber-500'}`}>
                    {ltvCacRatio === 9999 ? "∞" : ltvCacRatio}x
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {verdict && (
            <Card className="border border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-primary">
                  <Sparkles className="w-5 h-5 mr-2" />
                  AI Viability Verdict
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                  {verdict}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
