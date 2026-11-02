"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileCode, Brain, Wrench, GitBranch, RefreshCw } from "lucide-react";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Header } from "@/components/header";
import { IndexingProgress } from "@/components/indexing-progress";
import { OverviewPanel } from "@/components/overview-panel";
import { ChatPanel } from "@/components/chat-panel";
import { MemoryPanel } from "@/components/memory-panel";
import { EnhancementPanel } from "@/components/enhancement-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function RepoDashboardPage() {
  const params = useParams();
  const repoId = params.id as string;
  const [activeTab, setActiveTab] = useState<"overview" | "chat" | "memory" | "enhancement">("overview");

  const {
    data: repo,
    isLoading: repoLoading,
    refetch: refetchRepo,
  } = useQuery({
    queryKey: queryKeys.repos.detail(repoId),
    queryFn: () => api.getRepo(repoId),
    refetchInterval: (query) => {
      const current = query.state.data;
      return current?.status === "ready" || current?.status === "failed" ? false : 3000;
    },
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: queryKeys.repos.overview(repoId),
    queryFn: () => api.getOverview(repoId),
    enabled: repo?.status === "ready",
  });

  if (repoLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 text-sm animate-pulse">Loading repository...</p>
        </div>
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <h2 className="text-lg font-semibold">Repository Not Found</h2>
          <Button onClick={() => window.location.href = "/"}>Return Home</Button>
        </div>
      </div>
    );
  }

  // If repo is still indexing or queued, display real-time SSE progress
  if (repo.status !== "ready") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Header repoName={`${repo.owner}/${repo.name}`} />
        <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
          <IndexingProgress repoId={repoId} onComplete={() => refetchRepo()} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header repoName={`${repo.owner}/${repo.name}`} />

      {/* Repo Title Bar */}
      <div className="border-b border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  {repo.owner}/{repo.name}
                </h1>
                <Badge variant="success">Ready</Badge>
              </div>
              <p className="text-xs text-slate-400">
                Default branch: <span className="font-mono text-slate-300">{repo.defaultBranch}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => api.refreshRepo(repo.id).then(() => refetchRepo())}
              title="Refresh / Re-index repository"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-index Diff
            </Button>
          </div>
        </div>
      </div>

      {/* Main Workspace Navigation & Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full space-y-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-b border-slate-800 pb-2">
          {[
            { id: "overview", label: "Onboarding Report", icon: BookOpen },
            { id: "chat", label: "RAG Code Chat", icon: FileCode },
            { id: "memory", label: "Memory State", icon: Brain },
            { id: "enhancement", label: "Enhancement Plan", icon: Wrench },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "overview" | "chat" | "memory" | "enhancement")}
                className={`flex items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600/10 border border-blue-500/20 text-blue-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Panels */}
        <div>
          {activeTab === "overview" && (
            overviewLoading || !overview ? (
              <div className="text-center py-16 text-slate-500 text-sm">Loading onboarding overview...</div>
            ) : (
              <OverviewPanel repoId={repo.id} repoName={repo.name} overview={overview} />
            )
          )}

          {activeTab === "chat" && (
            <ChatPanel repoId={repo.id} repoUrl={repo.url} repoName={repo.name} />
          )}

          {activeTab === "memory" && (
            <MemoryPanel repoId={repo.id} />
          )}

          {activeTab === "enhancement" && (
            <EnhancementPanel repoId={repo.id} />
          )}
        </div>
      </main>
    </div>
  );
}

