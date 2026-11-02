"use client";

import React from "react";
import { Cpu } from "lucide-react";
import { Header } from "@/components/header";
import { RepoInput } from "@/components/repo-input";
import { ExampleRepos } from "@/components/example-repos";
import { RecentRepos } from "@/components/recent-repos";

export default function HomePage() {

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-blue-400" /> AST Parsing via web-tree-sitter & Hybrid RAG
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Master Any Codebase in <span className="text-blue-500">Minutes</span>, Not Weeks
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">
            Paste any GitHub repository URL. RepoMentor extracts AST symbols, builds dense vector and full-text
            indexes, and generates a grounded contributor onboarding report with line-level citations.
          </p>

          <div className="pt-4">
            <RepoInput />
          </div>
        </div>

        {/* Example Repos */}
        <div className="space-y-3 max-w-5xl mx-auto">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            Explore Example Codebases:
          </span>
          <ExampleRepos onSelect={(url) => {
            // copy or set directly
            const input = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (input) {
              input.value = url;
              input.dispatchEvent(new Event("input", { bubbles: true }));
            }
          }} />
        </div>

        {/* Recently Indexed Repositories */}
        <div className="max-w-5xl mx-auto pt-6">
          <RecentRepos />
        </div>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        RepoMentor — Senior Staff Architecture & Onboarding System &copy; 2026. Built with TypeScript, Fastify, Next.js, Drizzle ORM, pgvector & BullMQ.
      </footer>
    </div>
  );
}
