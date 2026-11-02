"use client";

import { GitBranch } from "lucide-react";

const EXAMPLE_REPOS = [
  { owner: "facebook", name: "react", desc: "UI component library with Fiber reconciler" },
  { owner: "vercel", name: "next.js", desc: "React framework for production" },
  { owner: "denoland", name: "deno", desc: "Secure JavaScript/TypeScript runtime" },
  { owner: "fastify", name: "fastify", desc: "Fast low-overhead web framework" },
];

export function ExampleRepos({ onSelect }: { onSelect: (url: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {EXAMPLE_REPOS.map((repo) => (
        <button
          key={`${repo.owner}/${repo.name}`}
          onClick={() => onSelect(`https://github.com/${repo.owner}/${repo.name}`)}
          className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/60 text-left transition group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition" />
            <span className="text-sm font-medium text-white">
              {repo.owner}/{repo.name}
            </span>
          </div>
          <p className="text-xs text-slate-500">{repo.desc}</p>
        </button>
      ))}
    </div>
  );
}

