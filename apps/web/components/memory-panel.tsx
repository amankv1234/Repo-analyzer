"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Brain, Trash2, Edit3, Check, X } from "lucide-react";
import { api, MemoryRecord } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface Props {
  repoId: string;
}

export function MemoryPanel({ repoId }: Props) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSummary, setEditSummary] = useState("");

  const { data: records, isLoading } = useQuery({
    queryKey: queryKeys.repos.memory(repoId),
    queryFn: () => api.getMemory(repoId),
  });

  const updateMutation = useMutation({
    mutationFn: ({ memoryId, summary }: { memoryId: string; summary: string }) =>
      api.updateMemory(repoId, memoryId, summary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.repos.memory(repoId) });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (memoryId: string) => api.deleteMemory(repoId, memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.repos.memory(repoId) });
    },
  });

  const handleStartEdit = (record: MemoryRecord) => {
    setEditingId(record.id);
    setEditSummary(record.summary);
  };

  const handleSaveEdit = (memoryId: string) => {
    if (!editSummary.trim()) return;
    updateMutation.mutate({ memoryId, summary: editSummary.trim() });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">3-Layer Persistent Memory</h3>
            <p className="text-xs text-slate-400">
              Tracks your comprehension state, ongoing development goals, and architectural preferences.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading memory records...</div>
      ) : !records || records.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Brain className="w-10 h-10 text-slate-700 mx-auto" />
            <h4 className="text-sm font-semibold text-white">No Long-Term Memories Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              As you chat with the assistant and explore this repository, episodic summaries and goals will be automatically persisted here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{r.type}</Badge>
                  <span className="text-[11px] text-slate-500">{formatDate(r.updatedAt)}</span>
                </div>

                <div className="flex items-center gap-1">
                  {editingId !== r.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(r)}
                      title="Edit memory"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete this memory record?")) {
                        deleteMutation.mutate(r.id);
                      }
                    }}
                    title="Delete memory"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                  </Button>
                </div>
              </div>

              {editingId === r.id ? (
                <div className="space-y-2 pt-1">
                  <textarea
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      <X className="w-3.5 h-3.5 mr-1" /> Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(r.id)}
                      disabled={updateMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-500"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
                  {r.summary}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

