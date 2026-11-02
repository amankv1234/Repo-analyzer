import { db, repositories, repoFiles, codeChunks, repoOverviews, memoryRecords } from "@repomentor/db";

async function seedMockData() {
  console.log("🌱 Seeding offline fixture data into RepoMentor database...");

  try {
    // 1. Create or find sample repo
    const [repo] = await db
      .insert(repositories)
      .values({
        url: "https://github.com/facebook/react",
        owner: "facebook",
        name: "react",
        defaultBranch: "main",
        status: "ready",
        size: 524000,
        languages: { JavaScript: 65, TypeScript: 30, Other: 5 },
      })
      .onConflictDoNothing()
      .returning();

    const activeRepo = repo || (await db.query.repositories.findFirst());
    if (!activeRepo) {
      throw new Error("Could not create or locate demo repository");
    }

    console.log(`✅ Seeded repository: ${activeRepo.owner}/${activeRepo.name} (${activeRepo.id})`);

    // 2. Create sample file
    const [file] = await db
      .insert(repoFiles)
      .values({
        repoId: activeRepo.id,
        path: "packages/react/src/ReactHooks.js",
        language: "javascript",
        hash: "seed_hash_react_hooks_12345",
        size: 2048,
      })
      .onConflictDoNothing()
      .returning();

    const activeFile = file || (await db.query.repoFiles.findFirst());
    if (activeFile) {
      // 3. Create code chunk with dummy embedding
      const dummyEmbedding = new Array(1536).fill(0.01);
      await db
        .insert(codeChunks)
        .values({
          repoId: activeRepo.id,
          fileId: activeFile.id,
          content: `export function useState(initialState) {\n  const dispatcher = resolveDispatcher();\n  return dispatcher.useState(initialState);\n}\n\nexport function useEffect(create, deps) {\n  const dispatcher = resolveDispatcher();\n  return dispatcher.useEffect(create, deps);\n}`,
          startLine: 20,
          endLine: 35,
          symbolName: "useState",
          symbolType: "function",
          embedding: dummyEmbedding,
          metadata: { docstring: "State hook resolution" },
        })
        .onConflictDoNothing();

      console.log(`✅ Seeded AST code chunks for ${activeFile.path}`);
    }

    // 4. Create sample overview
    await db
      .insert(repoOverviews)
      .values({
        repoId: activeRepo.id,
        version: 1,
        sections: {
          summary: "React is a JavaScript library for building user interfaces based on a declarative component model.",
          purpose: "Decouples the core reconciler algorithm (Fiber) from platform renderers (DOM, Native, Canvas).",
          techStack: [
            { name: "JavaScript / TypeScript", category: "Language", justification: "Universal web compatibility" },
            { name: "Rollup", category: "Build Tool", justification: "Optimized bundle distribution" },
            { name: "Jest", category: "Testing", justification: "Comprehensive unit testing" },
          ],
          architecture: {
            description: "Three-tier architecture separating Component Trees, Fiber Reconciler, and Platform Host Configs.",
            mermaidDiagram: "flowchart TD\n  React[packages/react] --> Reconciler[packages/react-reconciler]\n  Reconciler --> DOM[packages/react-dom]",
          },
          folderStructure: [
            { path: "packages/react", description: "Core element and hook APIs" },
            { path: "packages/react-reconciler", description: "Fiber work-tag allocations and reconciliation loop" },
          ],
          setupGuide: {
            prerequisites: ["Node.js 22 LTS", "yarn or pnpm"],
            steps: ["pnpm install", "pnpm build", "pnpm test"],
            troubleshooting: ["Ensure Java 17 is installed if building native bindings"],
          },
          keyFiles: [
            { path: "packages/react/src/ReactHooks.js", reason: "Hook dispatcher resolution", readOrder: 1 },
            { path: "packages/react-reconciler/src/ReactFiber.js", reason: "Fiber node data structure", readOrder: 2 },
          ],
          contributionWorkflow: {
            branchNaming: "feature/<name>",
            prProcess: "Pass automated CI and unit tests before requesting review",
            commitFormat: "Conventional Commits",
          },
          commonPitfalls: ["Never mutate state directly", "Ensure hooks are called unconditionally"],
          goodFirstAreas: ["Typing fixes in packages/react", "Documentation updates"],
        },
      })
      .onConflictDoNothing();

    console.log("✅ Seeded onboarding report overview");

    // 5. Create sample memory record
    await db
      .insert(memoryRecords)
      .values({
        repoId: activeRepo.id,
        userId: null,
        type: "long_term_summary",
        summary: "### Active Goal\nExploring React hooks dispatcher resolution and fiber reconciler connection.\n\n### Comprehension State\nUnderstands useState and useEffect delegation to the current dispatcher.\n\n### Traversed Files\n- packages/react/src/ReactHooks.js",
        metadata: { source: "seed" },
      })
      .onConflictDoNothing();

    console.log("✅ Seeded 3-layer episodic memory records");
    console.log("\n🎉 Fixture seed complete! Open http://localhost:3000 to explore the React onboarding dashboard.\n");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seedMockData();

