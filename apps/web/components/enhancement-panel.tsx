"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Wrench, Sparkles, AlertCircle, CheckCircle2, Loader2, GitCommit } from "lucide-react";
import { api, EnhancementPlan } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  repoId: string;
}

export function EnhancementPanel({ repoId }: Props) {
  const [requestText, setRequestText] = useState("");
  const [plan, setPlan] = useState<EnhancementPlan | null>(null);

  const mutation = useMutation({
    mutationFn: (text: string) => api.sendEnhancement(repoId, text),
    onSuccess: (data) => setPlan(data),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText.trim() || mutation.isPending) return;
    mutation.mutate(requestText.trim());
  };

  return (
    <div className="space-y-6">
      {/* Header input form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="w-5 h-5 text-blue-400" /> Enhancement & Bug Fix Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-slate-400">
              Describe a feature you want to add or a bug you need to fix. RepoMentor will retrieve relevant code symbols, perform impact analysis, and generate a step-by-step plan with suggested unified diffs.
            </p>
            <textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder="e.g. Add distributed rate limiting middleware to the Fastify API routes..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!requestText.trim() || mutation.isPending}
                className="bg-blue-600 hover:bg-blue-500"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Generate Grounded Plan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results View */}
      {plan && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Plan Header */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 space-y-1">
            <h3 className="text-base font-semibold text-white">{plan.title}</h3>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs text-slate-400">Affected files:</span>
              {plan.affectedFiles?.map((file, i) => (
                <Badge key={i} variant="outline" className="font-mono text-[11px]">
                  {file}
                </Badge>
              ))}
            </div>
          </div>

          {/* Step by Step Implementation Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Step-by-Step Implementation Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.stepByStepPlan?.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                        {step.stepNumber}
                      </span>
                      <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400 pl-7 leading-relaxed">{step.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Test Strategy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-purple-400" /> Test & Verification Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {plan.testStrategy?.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                  >
                    <Badge variant="secondary" className="shrink-0 uppercase text-[10px]">
                      {t.testType}
                    </Badge>
                    <p className="text-slate-300">{t.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Suggested Diffs */}
          {plan.diffSuggestions && plan.diffSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-blue-400" /> Suggested Code Diffs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.diffSuggestions.map((diffItem, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-blue-300">{diffItem.filePath}</span>
                      <span className="text-xs text-slate-500">{diffItem.explanation}</span>
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs overflow-x-auto leading-relaxed">
                      {diffItem.diff.split("\n").map((line, lIdx) => {
                        let colorClass = "text-slate-300";
                        if (line.startsWith("+")) colorClass = "text-emerald-400 bg-emerald-950/20";
                        else if (line.startsWith("-")) colorClass = "text-red-400 bg-red-950/20";
                        else if (line.startsWith("@@")) colorClass = "text-purple-400 font-bold";

                        return (
                          <div key={lIdx} className={colorClass}>
                            {line || " "}
                          </div>
                        );
                      })}
                    </pre>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

