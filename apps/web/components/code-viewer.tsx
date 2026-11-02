"use client";

import React, { useState } from "react";
import { X, ExternalLink, Copy, Check, FileCode } from "lucide-react";
import { Citation, FileContent } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface Props {
  citation: Citation | null;
  fileContent?: FileContent | null;
  repoUrl?: string;
  onClose: () => void;
}

export function CodeViewer({ citation, fileContent, repoUrl, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!citation) return null;

  const content = fileContent?.content || citation.snippet || "// Content loading or unavailable";
  const lines = content.split("\n");

  const startLine = citation.startLine;
  const endLine = citation.endLine;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const githubUrl = repoUrl
    ? `${repoUrl}/blob/main/${citation.filePath}#L${startLine}-L${endLine}`
    : null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-5 h-5 text-blue-400 shrink-0" />
          <div className="truncate">
            <h3 className="text-sm font-semibold text-white font-mono truncate">
              {citation.filePath}
            </h3>
            <p className="text-xs text-slate-400">
              Lines {startLine} - {endLine}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy code">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </Button>

          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-white transition rounded-md hover:bg-slate-800"
              title="View on GitHub"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <Button variant="ghost" size="sm" onClick={onClose} title="Close">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 overflow-auto p-4 font-mono text-xs bg-slate-950 text-slate-200">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = (fileContent?.startLine ?? 1) + idx;
              const isTargetRange = lineNum >= startLine && lineNum <= endLine;

              return (
                <tr
                  key={idx}
                  className={isTargetRange ? "bg-blue-900/30 text-blue-200 font-semibold" : "hover:bg-slate-900/40"}
                >
                  <td className="pr-4 py-0.5 text-right text-slate-600 select-none w-10 text-[11px]">
                    {lineNum}
                  </td>
                  <td className="py-0.5 whitespace-pre overflow-x-auto">
                    {line || " "}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

