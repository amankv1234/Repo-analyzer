const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || res.statusText);
  }
  return res.json() as Promise<T>;
}

export interface RepoResponse {
  id: string;
  url: string;
  owner: string;
  name: string;
  defaultBranch: string;
  lastIndexedCommit: string | null;
  status: "queued" | "cloning" | "parsing" | "indexing" | "ready" | "failed";
  size: number | null;
  languages: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface IndexRepoResponse {
  repoId: string;
  jobId: string;
  status: string;
  message: string;
}

export interface OverviewResponse {
  repoId: string;
  version: number;
  generatedAt: string;
  sections: Record<string, unknown>;
}

export interface FileNode {
  id: string;
  path: string;
  language: string;
  size: number;
}

export interface FileContent {
  id: string;
  path: string;
  language: string;
  size: number;
  content: string;
  startLine?: number;
  endLine?: number;
}

export interface MemoryRecord {
  id: string;
  userId: string | null;
  repoId: string;
  type: string;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface JobStatus {
  id: string;
  repoId: string;
  status: "pending" | "active" | "completed" | "failed";
  progress: number;
  currentStep: string | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: Citation[];
  createdAt: string;
}

export interface Citation {
  filePath: string;
  startLine: number;
  endLine: number;
  snippet?: string;
  symbolName?: string | null;
}

export interface EnhancementPlan {
  title: string;
  affectedFiles: string[];
  stepByStepPlan: { stepNumber: number; title: string; description: string }[];
  testStrategy: { testType: string; description: string }[];
  diffSuggestions: { filePath: string; diff: string; explanation: string }[];
}

export const api = {
  submitRepo: (url: string, branch?: string) =>
    request<IndexRepoResponse>("/api/v1/repos", {
      method: "POST",
      body: JSON.stringify({ url, branch }),
    }),

  listRepos: () => request<RepoResponse[]>("/api/v1/repos"),

  getRepo: (id: string) => request<RepoResponse>(`/api/v1/repos/${id}`),

  getOverview: (id: string) => request<OverviewResponse>(`/api/v1/repos/${id}/overview`),

  getFiles: (id: string) => request<FileNode[]>(`/api/v1/repos/${id}/files`),

  getFileContent: (repoId: string, fileId: string, startLine?: number, endLine?: number) => {
    const params = new URLSearchParams();
    if (startLine !== undefined) params.set("startLine", String(startLine));
    if (endLine !== undefined) params.set("endLine", String(endLine));
    const qs = params.toString();
    return request<FileContent>(`/api/v1/repos/${repoId}/files/${fileId}${qs ? `?${qs}` : ""}`);
  },

  deleteRepo: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/v1/repos/${id}`, { method: "DELETE" }),

  refreshRepo: (id: string) =>
    request<IndexRepoResponse>(`/api/v1/repos/${id}/refresh`, { method: "POST" }),

  getMemory: (id: string) => request<MemoryRecord[]>(`/api/v1/repos/${id}/memory`),

  updateMemory: (repoId: string, memoryId: string, summary: string) =>
    request<MemoryRecord>(`/api/v1/repos/${repoId}/memory/${memoryId}`, {
      method: "PATCH",
      body: JSON.stringify({ summary }),
    }),

  deleteMemory: (repoId: string, memoryId: string) =>
    request<{ success: boolean }>(`/api/v1/repos/${repoId}/memory/${memoryId}`, {
      method: "DELETE",
    }),

  getJobStatus: (id: string) => request<JobStatus>(`/api/v1/jobs/${id}`),

  getMessages: (convoId: string) =>
    request<ChatMessage[]>(`/api/v1/conversations/${convoId}/messages`),

  sendEnhancement: (repoId: string, enhancementRequest: string) =>
    request<EnhancementPlan>(`/api/v1/repos/${repoId}/enhancement`, {
      method: "POST",
      body: JSON.stringify({ request: enhancementRequest }),
    }),

  exportMarkdown: async (id: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/api/v1/repos/${id}/export/markdown`);
    return res.text();
  },

  exportContributing: async (id: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/api/v1/repos/${id}/export/contributing`);
    return res.text();
  },
};

/** Raw fetch for SSE streaming - returns the Response for manual stream reading */
export function fetchChatStream(
  repoId: string,
  content: string,
  questionType?: string
): Promise<Response> {
  return fetch(`${API_BASE}/api/v1/repos/${repoId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, questionType }),
  });
}
