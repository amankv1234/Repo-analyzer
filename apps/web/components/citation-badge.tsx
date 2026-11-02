"use client";

import React from "react";
import { FileCode } from "lucide-react";
import { Citation } from "@/lib/api-client";

interface Props {
  citation: Citation;
  onClick: (citation: Citation) => void;
}

export function CitationBadge({ citation, onClick }: Props) {
  const fileName = citation.filePath.split("/").pop() || citation.filePath;

  return (
    <button
      type="button"
      onClick={() => onClick(citation)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 my-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      title={`${citation.filePath}:${citation.startLine}-${citation.endLine}`}
    >
      <FileCode className="w-3.5 h-3.5 shrink-0 text-blue-400" />
      <span>{fileName}:{citation.startLine}-{citation.endLine}</span>
    </button>
  );
}

