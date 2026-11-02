"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Circle, Loader2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "queued", label: "Queued", icon: Circle },
  { key: "cloning", label: "Cloning Repository", icon: Circle },
  { key: "analyzing", label: "Analyzing Code", icon: Circle },
  { key: "embedding", label: "Generating Embeddings", icon: Circle },
  { key: "generating_overview", label: "Creating Overview", icon: Circle },
  { key: "completed", label: "Complete", icon: CheckCircle },
];

interface Props {
  repoId: string;
  onComplete?: () => void;
}

export function IndexingProgress({ repoId, onComplete }: Props) {
  const [status, setStatus] = useState("queued");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("queued");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const es = new EventSource(`${API_BASE}/api/v1/repos/${repoId}/status`);
    eventSourceRef.current = es;

    es.addEventListener("status", (event) => {
      try {
        const data = JSON.parse(event.data);
        setStatus(data.status);
        setProgress(data.progress || 0);
        setCurrentStep(data.currentStep || data.status);

        if (data.status === "ready" || data.status === "completed") {
          setProgress(100);
          es.close();
          onComplete?.();
        } else if (data.status === "failed") {
          setError(data.error || "Indexing failed");
          es.close();
        }
      } catch {
        // skip
      }
    });

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [repoId, onComplete]);

  const currentIndex = STAGES.findIndex((s) => s.key === currentStep);

  return (
    <div className="max-w-xl mx-auto space-y-8 py-16">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Indexing Repository</h2>
        <p className="text-slate-400 text-sm">
          Analyzing code structure, generating embeddings, and building your onboarding report.
        </p>
      </div>

      <Progress value={progress} />

      <div className="space-y-3">
        {STAGES.map((stage, i) => {
          const isComplete = i < currentIndex || status === "ready";
          const isCurrent = i === currentIndex && status !== "ready" && status !== "failed";
          const isFailed = status === "failed" && i === currentIndex;

          const Icon = isFailed ? XCircle : isComplete ? CheckCircle : isCurrent ? Loader2 : Circle;

          return (
            <div
              key={stage.key}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition",
                isComplete && "bg-emerald-500/5 border border-emerald-500/10",
                isCurrent && "bg-blue-500/5 border border-blue-500/10",
                isFailed && "bg-red-500/5 border border-red-500/10",
                !isComplete && !isCurrent && !isFailed && "opacity-40"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  isComplete && "text-emerald-400",
                  isCurrent && "text-blue-400 animate-spin",
                  isFailed && "text-red-400",
                  !isComplete && !isCurrent && !isFailed && "text-slate-600"
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  isComplete && "text-emerald-300",
                  isCurrent && "text-blue-300",
                  isFailed && "text-red-300",
                  !isComplete && !isCurrent && !isFailed && "text-slate-600"
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="text-center space-y-3">
          <p className="text-sm text-red-400">{error}</p>
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      )}
    </div>
  );
}

