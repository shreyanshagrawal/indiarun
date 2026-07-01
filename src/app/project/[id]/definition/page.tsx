"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { fetchWithAuth } from "@/lib/api";

export default function DefinitionPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchWithAuth(`/project/${projectId}/definition`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const handleDownloadPRD = () => {
    if (!data?.prd) return;
    const blob = new Blob([data.prd], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PRD_${projectId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 font-medium">Loading definition artifacts...</span>
      </div>
    );
  }

  if (!data) {
    return <div className="container py-10">Error loading data.</div>;
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-6 -ml-4">
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Dashboard
      </Button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Definition Engine</h1>
          <p className="text-muted-foreground mt-2">
            Review the AI-generated Personas, Feature Prioritization, and Product Requirements Document (PRD).
          </p>
        </div>
        <Button onClick={() => router.push(`/project/${projectId}/prototype`)}>
          Approve prioritization & PRD
        </Button>
      </div>

      <Tabs defaultValue="personas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="personas" className="text-base">Target Personas</TabsTrigger>
          <TabsTrigger value="features" className="text-base">Feature Prioritization</TabsTrigger>
          <TabsTrigger value="prd" className="text-base">PRD Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="personas">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.personas?.map((persona: any) => (
              <Card key={persona.id} className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl">{persona.name}</CardTitle>
                  <CardDescription className="italic">"{persona.quote}"</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <span className="font-semibold text-primary">Demographics: </span>
                    {JSON.stringify(persona.demographics)}
                  </div>
                  <div>
                    <span className="font-semibold text-primary">Scenario: </span>
                    {persona.scenario}
                  </div>
                  <div>
                    <span className="font-semibold text-primary">Goals: </span>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
                      {persona.goals?.map((goal: string, i: number) => <li key={i}>{goal}</li>)}
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold text-primary">Pain Points: </span>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
                      {persona.pain_points?.map((pp: string, i: number) => <li key={i}>{pp}</li>)}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!data.personas?.length && <p className="text-muted-foreground">No personas generated.</p>}
          </div>
        </TabsContent>

        <TabsContent value="features">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>RICE Prioritization</CardTitle>
              <CardDescription>
                Features scored by Reach, Impact, and Confidence. Effort is defaulted to 1.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Feature</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Reach (1-10)</TableHead>
                    <TableHead className="text-right">Impact (1-10)</TableHead>
                    <TableHead className="text-right">Confidence (%)</TableHead>
                    <TableHead className="text-right font-semibold text-primary">RICE Score</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.features?.sort((a:any, b:any) => b.rice_score - a.rice_score).map((f: any) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.description}</TableCell>
                      <TableCell className="text-right">{f.reach}</TableCell>
                      <TableCell className="text-right">{f.impact}</TableCell>
                      <TableCell className="text-right">{Math.round(f.confidence * 100)}%</TableCell>
                      <TableCell className="text-right font-bold text-primary">{Math.round(f.rice_score * 10) / 10}</TableCell>
                      <TableCell>
                        <Badge variant={f.priority_label === 'very_high' ? 'destructive' : f.priority_label === 'high' ? 'default' : 'secondary'}>
                          {f.priority_label.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prd">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Uber-Template PRD</CardTitle>
                <CardDescription>Compiled from Intake Brief, Brand Brief, Personas, and Features.</CardDescription>
              </div>
              <Button onClick={handleDownloadPRD} variant="outline">
                <Download className="mr-2 h-4 w-4" /> Download .md
              </Button>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none dark:prose-invert">
                <ReactMarkdown>{data.prd || "*No PRD content found.*"}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
