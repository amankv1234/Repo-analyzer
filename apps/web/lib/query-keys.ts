export const queryKeys = {
  repos: {
    all: ["repos"] as const,
    detail: (id: string) => ["repos", id] as const,
    overview: (id: string) => ["repos", id, "overview"] as const,
    files: (id: string) => ["repos", id, "files"] as const,
    memory: (id: string) => ["repos", id, "memory"] as const,
  },
  jobs: {
    detail: (id: string) => ["jobs", id] as const,
  },
  conversations: {
    messages: (id: string) => ["conversations", id, "messages"] as const,
  },
} as const;
