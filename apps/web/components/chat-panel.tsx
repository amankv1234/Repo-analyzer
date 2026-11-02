"use client";

import React, { useState } from "react";
import { Send, Square, Trash2, Sparkles, Bot, User } from "lucide-react";
import { useChat } from "@/lib/use-chat";
import { Citation, FileContent, api } from "@/lib/api-client";
import { CitationBadge } from "./citation-badge";
import { CodeViewer } from "./code-viewer";
import { Button } from "@/components/ui/button";

interface Props {
  repoId: string;
  repoUrl?: string;
  repoName: string;
}

const STARTER_QUESTIONS = [
  { q: "Where is the main entry point and runtime bootstrap configured?", type: "where_is_implemented" },
  { q: "How do I run tests and configure the local dev environment?", type: "how_to_run" },
  { q: "Explain the core architectural flow and main data abstractions.", type: "explain_code" },
  { q: "What are the common pitfalls and guidelines when submitting a PR?", type: "general" },
];

export function ChatPanel({ repoId, repoUrl, repoName }: Props) {
  const { messages, sendMessage, isStreaming, stopStreaming, clearMessages, intent } = useChat(repoId);
  const [input, setInput] = useState("");
  const [questionType, setQuestionType] = useState<string>("general");
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const text = input.trim();
    setInput("");
    sendMessage(text, questionType);
  };

  const handleCitationClick = async (citation: Citation) => {
    setActiveCitation(citation);
    try {
      const files = await api.getFiles(repoId);
      const target = files.find((f) => f.path === citation.filePath);
      if (target) {
        const content = await api.getFileContent(
          repoId,
          target.id,
          Math.max(1, citation.startLine - 5),
          citation.endLine + 15
        );
        setFileContent(content);
      } else {
        setFileContent(null);
      }
    } catch {
      setFileContent(null);
    }
  };

  return (
    <div className="relative flex flex-col h-[750px] rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
      {/* Top control bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-white">RAG Technical Assistant</span>
          {intent && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono">
              Intent: {intent}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-300 rounded-md text-xs px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="general">General Query</option>
            <option value="explain_code">Explain Code</option>
            <option value="where_is_implemented">Where is X Implemented?</option>
            <option value="how_to_run">How to Run / Setup</option>
            <option value="add_feature">Add Feature / Enhancement</option>
          </select>

          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearMessages} title="Clear history">
              <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Ask Anything About {repoName}</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Answers are grounded directly in AST-parsed code chunks with verifiable line citations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg pt-2 text-left">
              {STARTER_QUESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestionType(item.type);
                    sendMessage(item.q, item.type);
                  }}
                  className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 text-xs text-slate-300 hover:text-white transition group"
                >
                  <p className="line-clamp-2 leading-relaxed">{item.q}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
                  RM
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-950/80 border border-slate-800 text-slate-200"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {msg.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse align-middle" />
                )}

                {/* Citations List */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                    <span className="text-[11px] text-slate-500 block w-full">Citations:</span>
                    {msg.citations.map((c, i) => (
                      <CitationBadge key={i} citation={c} onClick={handleCitationClick} />
                    ))}
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-blue-500 transition">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a technical question about implementation, modules, or setup..."
            className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none placeholder:text-slate-500 py-1"
          />

          {isStreaming ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={stopStreaming}
              title="Stop generating"
            >
              <Square className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </form>

      {/* Side-by-side Code Inspection Drawer */}
      <CodeViewer
        citation={activeCitation}
        fileContent={fileContent}
        repoUrl={repoUrl}
        onClose={() => {
          setActiveCitation(null);
          setFileContent(null);
        }}
      />
    </div>
  );
}

