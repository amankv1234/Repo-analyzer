import { z } from "zod";

export const CodeCitationSchema = z.object({
  filePath: z.string(),
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
  snippet: z.string().optional(),
  symbolName: z.string().nullable().optional(),
});

export const TechStackItemSchema = z.object({
  name: z.string(),
  category: z.enum([
    "Language",
    "Framework",
    "Database",
    "Build Tool",
    "Testing",
    "Library",
    "Infra",
    "Other",
  ]),
  justification: z.string(),
  whyLikelyChosen: z.string().optional(),
});

export const FolderNodeSchema = z.object({
  path: z.string(),
  description: z.string(),
  fileCount: z.number().optional(),
});

export const KeyFileItemSchema = z.object({
  path: z.string(),
  reason: z.string(),
  readOrder: z.number().int().positive(),
  criticalSymbols: z.array(z.string()).optional(),
});

export const SetupGuideSchema = z.object({
  prerequisites: z.array(z.string()),
  steps: z.array(z.string()),
  troubleshooting: z.array(z.string()),
});

export const ContributionWorkflowSchema = z.object({
  branchNaming: z.string(),
  prProcess: z.string(),
  commitFormat: z.string(),
});

export const ArchitectureOverviewSchema = z.object({
  description: z.string(),
  mermaidDiagram: z.string(),
});

export const RepoOverviewSectionsSchema = z.object({
  summary: z.string(),
  purpose: z.string(),
  techStack: z.array(TechStackItemSchema),
  architecture: ArchitectureOverviewSchema,
  folderStructure: z.array(FolderNodeSchema),
  setupGuide: SetupGuideSchema,
  keyFiles: z.array(KeyFileItemSchema),
  contributionWorkflow: ContributionWorkflowSchema,
  codeConventions: z.array(z.string()).optional(),
  commonPitfalls: z.array(z.string()).optional(),
  goodFirstAreas: z.array(z.string()).optional(),
});

export const IndexRepoRequestSchema = z.object({
  url: z
    .string()
    .url("Must be a valid Git URL")
    .refine(
      (val) => {
        try {
          const u = new URL(val);
          return (
            u.protocol === "https:" &&
            (u.hostname === "github.com" || u.hostname === "www.github.com")
          );
        } catch {
          return false;
        }
      },
      { message: "Only public https://github.com/owner/repo URLs are supported" }
    ),
  branch: z.string().optional().default("main"),
});

export const IndexRepoResponseSchema = z.object({
  repoId: z.string().uuid(),
  jobId: z.string(),
  status: z.enum(["queued", "cloning", "parsing", "indexing", "ready", "failed"]),
  message: z.string(),
});

export const RepoResponseSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  owner: z.string(),
  name: z.string(),
  defaultBranch: z.string(),
  lastIndexedCommit: z.string().nullable(),
  status: z.enum(["queued", "cloning", "parsing", "indexing", "ready", "failed"]),
  size: z.number().nullable(),
  languages: z.record(z.number()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RepoOverviewResponseSchema = z.object({
  repoId: z.string().uuid(),
  version: z.number().int(),
  generatedAt: z.string(),
  sections: RepoOverviewSectionsSchema,
});

export const JobStatusResponseSchema = z.object({
  id: z.string(),
  repoId: z.string().uuid(),
  status: z.enum(["pending", "active", "completed", "failed"]),
  progress: z.number().int().min(0).max(100),
  currentStep: z.string().nullable(),
  error: z.string().nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
});

export const CreateConversationRequestSchema = z.object({
  title: z.string().min(1).max(255).optional().default("New Conversation"),
});

export const ConversationResponseSchema = z.object({
  id: z.string().uuid(),
  repoId: z.string().uuid(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SendMessageRequestSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty"),
  questionType: z
    .enum(["explain_code", "how_to_run", "where_is_implemented", "add_feature", "general"])
    .optional(),
});

export const MessageResponseSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  citations: z.array(CodeCitationSchema),
  createdAt: z.string(),
});

export const MemoryRecordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  repoId: z.string().uuid(),
  type: z.enum([
    "short_term",
    "repo_state",
    "long_term_summary",
    "preference",
    "decision",
    "enhancement_idea",
  ]),
  summary: z.string(),
  metadata: z.record(z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const UpdateMemoryRequestSchema = z.object({
  summary: z.string().min(1),
});

export const EnhancementRequestSchema = z.object({
  request: z.string().min(5, "Enhancement description must be at least 5 characters"),
});

export const FileNodeResponseSchema = z.object({
  id: z.string().uuid(),
  path: z.string(),
  language: z.string(),
  size: z.number(),
});

export const FileContentResponseSchema = z.object({
  id: z.string().uuid(),
  path: z.string(),
  language: z.string(),
  size: z.number(),
  content: z.string(),
  startLine: z.number().optional(),
  endLine: z.number().optional(),
});

export const ErrorResponseSchema = z.object({
  type: z.string().url().optional(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  instance: z.string().optional(),
  reqId: z.string().optional(),
});
