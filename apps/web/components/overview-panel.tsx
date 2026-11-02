"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Terminal,
  Layers,
  FileCode,
  Check,
  Copy,
  Download,
  GitPullRequest,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { api, OverviewResponse } from "@/lib/api-client";

interface TechStackItem {
  name: string;
  category?: string;
  justification?: string;
  whyLikelyChosen?: string;
}

interface KeyFileItem {
  path: string;
  reason?: string;
  readOrder?: number;
}

interface ArchitectureSection {
  description?: string;
  mermaidDiagram?: string;
}

interface SetupGuideSection {
  prerequisites?: string[];
  steps?: string[];
}

interface OverviewSections {
  summary?: string;
  purposeAndProblem?: string;
  purpose?: string;
  architectureOverview?: string;
  techStack?: TechStackItem[];
  architecture?: ArchitectureSection;
  setupGuide?: SetupGuideSection;
  keyFiles?: KeyFileItem[];
  commonPitfalls?: string[];
  goodFirstAreas?: string[];
}

interface Props {
  repoId: string;
  repoName: string;
  overview: OverviewResponse;
}

export function OverviewPanel({ repoId, repoName, overview }: Props) {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const sections = (overview.sections || {}) as OverviewSections;

  const handleCopyStep = (stepText: string, index: number) => {
    navigator.clipboard.writeText(stepText);
    setCopiedStep(index);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const handleDownload = async (type: "markdown" | "contributing") => {
    try {
      setExporting(type);
      const text =
        type === "markdown"
          ? await api.exportMarkdown(repoId)
          : await api.exportContributing(repoId);

      const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = type === "markdown" ? `${repoName}-overview.md` : "CONTRIBUTING.md";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export documentation");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top action bar: Export options */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white">Contributor Onboarding Guide</h2>
          <p className="text-xs text-slate-400">
            Synthesized via static AST analysis & Claude 3.5 Sonnet architecture mentor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload("markdown")}
            disabled={exporting !== null}
          >
            <Download className="w-4 h-4 mr-1.5" />
            {exporting === "markdown" ? "Exporting..." : "Export Markdown"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload("contributing")}
            disabled={exporting !== null}
          >
            <GitPullRequest className="w-4 h-4 mr-1.5" />
            {exporting === "contributing" ? "Exporting..." : "Export CONTRIBUTING.md"}
          </Button>
        </div>
      </div>

      {/* Purpose & Problem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" /> Project Summary & Purpose
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-200 leading-relaxed">
            {sections.summary || sections.purposeAndProblem || "Repository summary unavailable."}
          </p>
          {sections.purpose && (
            <div className="p-3.5 rounded-lg bg-blue-950/20 border border-blue-900/40 text-xs text-blue-300">
              <strong className="font-semibold block mb-1">Why this project exists:</strong>
              {sections.purpose}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tech Stack Breakdown */}
      {sections.techStack && Array.isArray(sections.techStack) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Technology Stack & Rationale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sections.techStack.map((item: TechStackItem, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">{item.name}</span>
                    <Badge variant="outline">{item.category || "Dependency"}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.justification || item.whyLikelyChosen || "Core runtime dependency"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Architecture & Flow */}
      {sections.architecture && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" /> Architecture & Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-300">
              {sections.architecture.description || sections.architectureOverview}
            </p>

            {sections.architecture.mermaidDiagram && (
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400">Mermaid Diagram Specification:</span>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-blue-300 text-xs font-mono overflow-x-auto leading-relaxed">
                  {sections.architecture.mermaidDiagram}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Local Setup Guide */}
      {sections.setupGuide && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" /> Local Setup Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.setupGuide.prerequisites && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Prerequisites
                </h4>
                <div className="flex flex-wrap gap-2">
                  {sections.setupGuide.prerequisites.map((p: string, i: number) => (
                    <Badge key={i} variant="secondary">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {sections.setupGuide.steps && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Setup Commands
                </h4>
                {sections.setupGuide.steps.map((step: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200"
                  >
                    <span>
                      <span className="text-slate-600 mr-2">{i + 1}.</span> {step}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyStep(step, i)}
                      title="Copy command"
                    >
                      {copiedStep === i ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key Files to Read First */}
      {sections.keyFiles && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-blue-400" /> Key Files (Reading Order)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sections.keyFiles.map((f: KeyFileItem, i: number) => (
                <div
                  key={i}
                  className="flex items-start justify-between p-3.5 rounded-lg bg-slate-950 border border-slate-800"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                        {f.readOrder || i + 1}
                      </span>
                      <span className="font-mono text-sm text-white font-medium">{f.path}</span>
                    </div>
                    <p className="text-xs text-slate-400 pl-7">{f.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pitfalls & First Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.commonPitfalls && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Common Pitfalls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                {sections.commonPitfalls.map((p: string, i: number) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {sections.goodFirstAreas && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Good First Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                {sections.goodFirstAreas.map((g: string, i: number) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

