"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, GitBranch } from "lucide-react";
import { formatDate } from "@/lib/utils";

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  ready: "success",
  queued: "secondary",
  cloning: "warning",
  parsing: "warning",
  indexing: "warning",
  failed: "destructive",
};

export function RecentRepos() {
  const { data: repos, isLoading } = useQuery({
    queryKey: queryKeys.repos.all,
    queryFn: api.listRepos,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!repos || repos.length === 0) {
    return (
      <div className="text-center py-12">
        <GitBranch className="w-10 h-10 text-slate-700 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No repositories analyzed yet. Paste a URL above to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Repositories</h2>
      {repos.map((repo) => (
        <Link
          key={repo.id}
          href={`/repos/${repo.id}`}
          className="block p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-blue-400 transition">
                {repo.owner.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-medium text-white text-sm">
                  {repo.owner}/{repo.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {formatDate(repo.updatedAt)}
                </div>
              </div>
            </div>
            <Badge variant={statusVariant[repo.status] || "secondary"}>
              {repo.status}
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}

