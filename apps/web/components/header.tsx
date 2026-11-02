"use client";

import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";

export function Header({ repoName }: { repoName?: string }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              RM
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              RepoMentor
            </span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
            v0.3.0
          </span>
          {repoName && (
            <>
              <span className="text-slate-600">/</span>
              <span className="text-sm text-slate-300 font-medium">{repoName}</span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-4 text-sm">
          <a
            href="http://localhost:4000/docs"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            API Docs <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="http://localhost:4000/health"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            Status <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </a>
        </div>
      </div>
    </header>
  );
}

