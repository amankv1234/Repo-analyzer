"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GitBranch, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function RepoInput() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: (repoUrl: string) => api.submitRepo(repoUrl),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.repos.all });
      router.push(`/repos/${data.repoId}`);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to submit repository");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("Please enter a repository URL");
      return;
    }

    try {
      const parsed = new URL(url.trim());
      if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") {
        setError("Only public GitHub repositories are supported");
        return;
      }
    } catch {
      setError("Invalid URL format");
      return;
    }

    submitMutation.mutate(url.trim());
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl focus-within:border-blue-500 transition">
          <GitBranch className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://github.com/owner/repository"
            className="flex-1 bg-transparent border-none text-white px-3 py-2 text-sm focus:outline-none placeholder:text-slate-500"
            aria-label="GitHub repository URL"
          />
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                Analyze Repo <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
      {error && (
        <p className="mt-2 text-sm text-red-400 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

