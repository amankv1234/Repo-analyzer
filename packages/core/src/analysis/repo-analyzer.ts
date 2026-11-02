import fs from "fs";
import path from "path";
import { RepoFacts } from "@repomentor/shared";
import { FilteredFile } from "../ingestion/file-filter";
import {
  parsePackageJson,
  parseRequirementsTxt,
  parseCargoToml,
  parseGoMod,
  parseJavaManifest,
} from "./dependency-parser";

export interface AnalyzerOptions {
  repoDir: string;
  files: FilteredFile[];
}

/**
 * Analyzes repository structure, files, dependencies, frameworks, entry points, and scripts
 * purely through deterministic static inspection (ZERO LLM calls).
 */
export async function analyzeRepository(options: AnalyzerOptions): Promise<RepoFacts> {
  const { repoDir, files } = options;

  // 1. Language breakdown by lines of code and bytes
  const langMap = new Map<string, { filesCount: number; linesOfCode: number; bytes: number }>();

  for (const f of files) {
    let loc = 0;
    try {
      const content = fs.readFileSync(f.absolutePath, "utf-8");
      loc = content.split("\n").length;
    } catch {
      loc = 0;
    }

    const current = langMap.get(f.language) || { filesCount: 0, linesOfCode: 0, bytes: 0 };
    current.filesCount += 1;
    current.linesOfCode += loc;
    current.bytes += f.sizeBytes;
    langMap.set(f.language, current);
  }

  const languages = Array.from(langMap.entries())
    .map(([language, data]) => ({ language, ...data }))
    .sort((a, b) => b.linesOfCode - a.linesOfCode);

  // 2. Folder summary & file tree
  const folderCounts = new Map<string, number>();
  for (const f of files) {
    const dir = path.dirname(f.relativePath).replace(/\\/g, "/");
    folderCounts.set(dir, (folderCounts.get(dir) || 0) + 1);
  }

  const folders = Array.from(folderCounts.entries())
    .map(([p, count]) => ({ path: p === "." ? "root" : p, fileCount: count }))
    .sort((a, b) => b.fileCount - a.fileCount);

  // 3. Dependency Manifests Parsing
  const allDeps: RepoFacts["dependencies"] = [];
  const allDepNames = new Set<string>();

  const manifestFiles = [
    { name: "package.json", parser: parsePackageJson },
    { name: "requirements.txt", parser: parseRequirementsTxt },
    { name: "Cargo.toml", parser: parseCargoToml },
    { name: "go.mod", parser: parseGoMod },
    { name: "pom.xml", parser: parseJavaManifest },
    { name: "build.gradle", parser: parseJavaManifest },
  ];

  for (const mf of manifestFiles) {
    // Check root and subdirectories
    for (const f of files) {
      if (path.basename(f.relativePath) === mf.name) {
        const res = mf.parser(f.absolutePath);
        if (res && res.items.length > 0) {
          allDeps.push(res);
          res.items.forEach((item) => allDepNames.add(item.name.toLowerCase()));
        }
      }
    }
  }

  // 4. Framework & Tool Detection
  const frameworksSet = new Set<string>();

  // JavaScript / TypeScript frameworks
  if (allDepNames.has("next") || allDepNames.has("@next/font")) frameworksSet.add("Next.js");
  if (allDepNames.has("react") || allDepNames.has("react-dom")) frameworksSet.add("React");
  if (allDepNames.has("fastify")) frameworksSet.add("Fastify");
  if (allDepNames.has("express")) frameworksSet.add("Express");
  if (allDepNames.has("vue")) frameworksSet.add("Vue");
  if (allDepNames.has("@angular/core")) frameworksSet.add("Angular");
  if (allDepNames.has("svelte")) frameworksSet.add("Svelte");
  if (allDepNames.has("nest") || allDepNames.has("@nestjs/core")) frameworksSet.add("NestJS");
  if (allDepNames.has("drizzle-orm")) frameworksSet.add("Drizzle ORM");
  if (allDepNames.has("prisma") || allDepNames.has("@prisma/client")) frameworksSet.add("Prisma");
  if (allDepNames.has("bullmq")) frameworksSet.add("BullMQ");
  if (allDepNames.has("tailwindcss")) frameworksSet.add("Tailwind CSS");

  // Python frameworks
  if (allDepNames.has("django")) frameworksSet.add("Django");
  if (allDepNames.has("flask")) frameworksSet.add("Flask");
  if (allDepNames.has("fastapi")) frameworksSet.add("FastAPI");
  if (allDepNames.has("torch") || allDepNames.has("pytorch")) frameworksSet.add("PyTorch");
  if (allDepNames.has("tensorflow")) frameworksSet.add("TensorFlow");

  // Rust frameworks
  if (allDepNames.has("tokio")) frameworksSet.add("Tokio");
  if (allDepNames.has("axum")) frameworksSet.add("Axum");
  if (allDepNames.has("actix-web")) frameworksSet.add("Actix Web");
  if (allDepNames.has("rocket")) frameworksSet.add("Rocket");

  // Go frameworks
  if (allDepNames.has("github.com/gin-gonic/gin")) frameworksSet.add("Gin");
  if (allDepNames.has("github.com/gofiber/fiber")) frameworksSet.add("Fiber");

  // 5. DB & Infrastructure hints
  const infraConfigs: string[] = [];

  const hasDockerfile = files.some(
    (f) =>
      path.basename(f.relativePath).toLowerCase() === "dockerfile" ||
      path.basename(f.relativePath).toLowerCase().startsWith("dockerfile.")
  );
  if (hasDockerfile) infraConfigs.push("Dockerfile");

  const hasDockerCompose = files.some((f) => {
    const base = path.basename(f.relativePath).toLowerCase();
    return base === "docker-compose.yml" || base === "docker-compose.yaml" || base === "compose.yml";
  });
  if (hasDockerCompose) infraConfigs.push("Docker Compose");

  const hasKubernetes = files.some(
    (f) => f.relativePath.includes("k8s/") || f.relativePath.includes("kubernetes/")
  );
  if (hasKubernetes) infraConfigs.push("Kubernetes Manifests");

  const hasTerraform = files.some((f) => f.relativePath.endsWith(".tf"));
  if (hasTerraform) infraConfigs.push("Terraform");

  // 6. Entry Points
  const entryPoints: string[] = [];
  const candidateEntryRegex =
    /^(src\/)?(index|main|app|server|cli)\.(ts|js|jsx|tsx|py|go|rs|java)$/i;

  for (const f of files) {
    if (candidateEntryRegex.test(f.relativePath)) {
      entryPoints.push(f.relativePath);
    }
  }

  // 7. Testing Setup
  const testFrameworks: string[] = [];
  if (allDepNames.has("vitest")) testFrameworks.push("Vitest");
  if (allDepNames.has("jest")) testFrameworks.push("Jest");
  if (allDepNames.has("mocha")) testFrameworks.push("Mocha");
  if (allDepNames.has("pytest")) testFrameworks.push("Pytest");
  if (allDepNames.has("playwright") || allDepNames.has("@playwright/test"))
    testFrameworks.push("Playwright");
  if (allDepNames.has("cypress")) testFrameworks.push("Cypress");

  const testDirs: string[] = [];
  for (const folder of folders) {
    const p = folder.path.toLowerCase();
    if (p === "test" || p === "tests" || p.includes("__tests__") || p === "spec") {
      testDirs.push(folder.path);
    }
  }

  const hasUnitTests =
    testFrameworks.length > 0 ||
    files.some((f) => f.relativePath.includes(".test.") || f.relativePath.includes(".spec."));
  const hasE2ETests =
    allDepNames.has("playwright") ||
    allDepNames.has("cypress") ||
    files.some((f) => f.relativePath.includes("e2e"));

  // 8. CI/CD Config
  const cicdProviders: string[] = [];
  const cicdFiles: string[] = [];
  for (const f of files) {
    if (f.relativePath.startsWith(".github/workflows/")) {
      if (!cicdProviders.includes("GitHub Actions")) cicdProviders.push("GitHub Actions");
      cicdFiles.push(f.relativePath);
    } else if (f.relativePath === ".gitlab-ci.yml") {
      cicdProviders.push("GitLab CI");
      cicdFiles.push(f.relativePath);
    } else if (f.relativePath.startsWith(".circleci/")) {
      cicdProviders.push("CircleCI");
      cicdFiles.push(f.relativePath);
    }
  }

  // 9. Linters & Formatters
  const linters: string[] = [];
  if (
    allDepNames.has("eslint") ||
    files.some((f) => path.basename(f.relativePath).startsWith(".eslintrc"))
  ) {
    linters.push("ESLint");
  }
  if (
    allDepNames.has("prettier") ||
    files.some((f) => path.basename(f.relativePath).startsWith(".prettierrc"))
  ) {
    linters.push("Prettier");
  }
  if (allDepNames.has("ruff")) linters.push("Ruff");
  if (allDepNames.has("black")) linters.push("Black");
  if (files.some((f) => path.basename(f.relativePath) === ".golangci.yml"))
    linters.push("GolangCI-Lint");

  // 10. Documentation Presence
  const docFiles: string[] = [];
  let hasReadme = false;
  let hasContributing = false;
  let hasLicense = false;
  let hasCodeOfConduct = false;
  let hasDocsDir = false;

  for (const f of files) {
    const base = path.basename(f.relativePath).toLowerCase();
    if (base.startsWith("readme")) {
      hasReadme = true;
      docFiles.push(f.relativePath);
    }
    if (base.startsWith("contributing")) {
      hasContributing = true;
      docFiles.push(f.relativePath);
    }
    if (base.startsWith("license")) {
      hasLicense = true;
      docFiles.push(f.relativePath);
    }
    if (base.startsWith("code_of_conduct")) {
      hasCodeOfConduct = true;
      docFiles.push(f.relativePath);
    }
    if (f.relativePath.startsWith("docs/")) {
      hasDocsDir = true;
    }
  }

  // 11. Environment Variable Discovery
  const envVarsMap = new Map<string, string>();

  // Look in .env.example or .env.sample
  for (const f of files) {
    const base = path.basename(f.relativePath).toLowerCase();
    if (base === ".env.example" || base === ".env.sample" || base === ".env.template") {
      try {
        const content = fs.readFileSync(f.absolutePath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const eq = trimmed.indexOf("=");
            if (eq !== -1) {
              const varName = trimmed.substring(0, eq).trim();
              if (varName && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
                envVarsMap.set(varName, f.relativePath);
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }

  const envVariables = Array.from(envVarsMap.entries()).map(([name, source]) => ({
    name,
    source,
  }));

  // 12. Runnable Scripts (package.json scripts, Makefile targets)
  const runnableScripts: RepoFacts["runnableScripts"] = [];

  const pkgJsonPath = path.join(repoDir, "package.json");
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
      if (pkg.scripts) {
        for (const [name, command] of Object.entries(pkg.scripts)) {
          runnableScripts.push({
            name,
            command: String(command),
            source: "package.json",
          });
        }
      }
    } catch {
      // ignore
    }
  }

  const makefilePath = path.join(repoDir, "Makefile");
  if (fs.existsSync(makefilePath)) {
    try {
      const content = fs.readFileSync(makefilePath, "utf-8");
      for (const line of content.split("\n")) {
        const match = line.match(/^([a-zA-Z0-9_-]+):(?:\s|$)/);
        if (match && match[1] && !match[1].startsWith(".")) {
          runnableScripts.push({
            name: match[1],
            command: `make ${match[1]}`,
            source: "Makefile",
          });
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    fileTree: {
      totalFiles: files.length,
      totalDirectories: folders.length,
      folders: folders.slice(0, 30),
    },
    languages,
    dependencies: allDeps,
    frameworks: Array.from(frameworksSet),
    infrastructure: {
      hasDockerfile,
      hasDockerCompose,
      hasKubernetes,
      hasTerraform,
      configs: infraConfigs,
    },
    entryPoints,
    testing: {
      frameworks: testFrameworks,
      testDirs,
      hasUnitTests,
      hasE2ETests,
    },
    cicd: {
      providers: cicdProviders,
      configFiles: cicdFiles,
    },
    linters,
    docsPresence: {
      hasReadme,
      hasContributing,
      hasLicense,
      hasCodeOfConduct,
      hasDocsDir,
      docFiles,
    },
    envVariables,
    runnableScripts,
  };
}

