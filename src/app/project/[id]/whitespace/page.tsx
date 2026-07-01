"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

export default function WhitespacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [summary, setSummary] = useState("The market lacks an affordable, user-friendly solution for this segment.");
  const [driver, setDriver] = useState("Desire for convenience");
  const [evidence, setEvidence] = useState("Users frequently mention saving time in surveys.");
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchWithAuth(`/project/${projectId}/brand_brief`, {
        method: "POST",
        body: JSON.stringify({
          whitespace_summary: summary,
          psychographic_target: {
            driver: driver,
            evidence_summary: evidence
          }
        })
      });
      router.push(`/project/${projectId}/definition`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-6 -ml-4">
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Temporary Brand Brief Form</CardTitle>
          <CardDescription>
            (Dev-only) Manually input the Brand Brief to bypass the Whitespace Engine and proceed to the Definition Engine.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Whitespace Summary</Label>
              <Textarea 
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Psychographic Driver</Label>
              <Input 
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Driver Evidence Summary</Label>
              <Input 
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Definition (Personas, Features, PRD)
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
