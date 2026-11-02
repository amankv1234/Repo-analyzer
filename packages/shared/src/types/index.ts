export type RepoStatus =
  | "queued"
  | "cloning"
  | "parsing"
  | "indexing"
  | "ready"
  | "failed";

export type JobStatus = "pending" | "active" | "completed" | "failed";

export type JobStep =
  | "queued"
  | "validating"
  | "metadata"
  | "cloning"
  | "analyzing"
  | "parsing_ast"
  | "generating_embeddings"
  | "synthesizing_overview"
  | "completed"
  | "failed";

export type MessageRole = "user" | "assistant" | "system";

export type MemoryType =
  | "short_term"
  | "repo_state"
  | "long_term_summary"
  | "preference"
  | "decision"
  | "enhancement_idea";

export type SymbolType =
  | "function"
  | "method"
  | "class"
  | "interface"
  | "type"
  | "enum"
  | "struct"
  | "module";

export interface CodeCitation {
  filePath: string;
  startLine: number;
  endLine: number;
  snippet?: string;
  symbolName?: string | null;
}

export interface TechStackItem {
  name: string;
  category: "Language" | "Framework" | "Database" | "Build Tool" | "Testing" | "Library" | "Infra" | "Other";
  justification: string;
  whyLikelyChosen?: string;
}

export interface FolderNode {
  path: string;
  description: string;
  fileCount?: number;
}

export interface KeyFileItem {
  path: string;
  reason: string;
  readOrder: number;
  criticalSymbols?: string[];
}

export interface SetupGuide {
  prerequisites: string[];
  steps: string[];
  troubleshooting: string[];
}

export interface ContributionWorkflow {
  branchNaming: string;
  prProcess: string;
  commitFormat: string;
}

export interface ArchitectureOverview {
  description: string;
  mermaidDiagram: string;
}

export interface RepoOverviewSections {
  summary: string;
  purpose: string;
  techStack: TechStackItem[];
  architecture: ArchitectureOverview;
  folderStructure: FolderNode[];
  setupGuide: SetupGuide;
  keyFiles: KeyFileItem[];
  contributionWorkflow: ContributionWorkflow;
  codeConventions?: string[];
  commonPitfalls?: string[];
  goodFirstAreas?: string[];
}

export interface UserSummaryMemory {
  goal: string;
  comprehensionState: string;
  traversedFiles: string[];
  preferences: string[];
  decisionsMade?: string[];
  openQuestions?: string[];
}

export interface DependencyItem {
  name: string;
  version: string;
  type: "runtime" | "dev" | "peer";
}

export interface RepoFacts {
  fileTree: {
    totalFiles: number;
    totalDirectories: number;
    folders: { path: string; fileCount: number }[];
  };
  languages: {
    language: string;
    filesCount: number;
    linesOfCode: number;
    bytes: number;
  }[];
  dependencies: {
    manifestFile: string;
    ecosystem: string;
    items: DependencyItem[];
  }[];
  frameworks: string[];
  infrastructure: {
    hasDockerfile: boolean;
    hasDockerCompose: boolean;
    hasKubernetes: boolean;
    hasTerraform: boolean;
    configs: string[];
  };
  entryPoints: string[];
  testing: {
    frameworks: string[];
    testDirs: string[];
    hasUnitTests: boolean;
    hasE2ETests: boolean;
  };
  cicd: {
    providers: string[];
    configFiles: string[];
  };
  linters: string[];
  docsPresence: {
    hasReadme: boolean;
    hasContributing: boolean;
    hasLicense: boolean;
    hasCodeOfConduct: boolean;
    hasDocsDir: boolean;
    docFiles: string[];
  };
  envVariables: {
    name: string;
    source: string;
    description?: string;
  }[];
  runnableScripts: {
    name: string;
    command: string;
    source: string;
  }[];
}

export interface GitHubRepoMetadata {
  owner: string;
  name: string;
  description: string | null;
  stars: number;
  topics: string[];
  license: string | null;
  defaultBranch: string;
  contributorsCount: number;
  lastCommitSha: string;
  openIssuesCount: number;
  languages: Record<string, number>;
}

export interface EnhancementPlan {
  featureOrBug: string;
  summary: string;
  targetFiles: {
    filePath: string;
    reason: string;
    existingSymbols: string[];
  }[];
  impactAnalysis: {
    affectedModules: string[];
    potentialRisks: string[];
  };
  stepByStepPlan: {
    stepNumber: number;
    title: string;
    description: string;
    targetFile: string;
  }[];
  testPlan: {
    testType: "unit" | "integration" | "e2e";
    description: string;
    testFile: string;
  }[];
  suggestedDiffs: {
    filePath: string;
    diff: string;
    explanation: string;
  }[];
}
