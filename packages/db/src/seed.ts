import { db, pool } from "./client";
import { repositories, repoOverviews } from "./schema";

async function seed() {
  console.log("🌱 Seeding baseline repository data...");
  try {
    const [sampleRepo] = await db
      .insert(repositories)
      .values({
        url: "https://github.com/facebook/react",
        owner: "facebook",
        name: "react",
        defaultBranch: "main",
        status: "ready",
        size: 15420000,
        languages: { JavaScript: 65, TypeScript: 30, Other: 5 },
      })
      .onConflictDoNothing()
      .returning();

    if (sampleRepo) {
      await db.insert(repoOverviews).values({
        repoId: sampleRepo.id,
        version: 1,
        sections: {
          summary: "React is the library for web and native user interfaces.",
          purpose: "Declarative UI rendering with virtual DOM and Fiber architecture.",
          techStack: [
            { name: "JavaScript", category: "Language", justification: "Ecosystem reach" },
            { name: "TypeScript", category: "Language", justification: "Type safety" },
          ],
          architecture: {
            description: "Core reconciler + platform-specific renderers",
            mermaidDiagram: "flowchart TD\n  ReactCore --> Reconciler\n  Reconciler --> ReactDOM",
          },
          folderStructure: [
            { path: "packages/react", description: "Core React library" },
            { path: "packages/react-reconciler", description: "Fiber reconciler" },
          ],
          setupGuide: {
            prerequisites: ["Node 22", "pnpm 9"],
            steps: ["pnpm install", "pnpm test"],
            troubleshooting: ["Ensure Node 22 is selected"],
          },
          keyFiles: [
            { path: "packages/react/src/ReactHooks.js", reason: "Hook declarations", readOrder: 1 },
          ],
          contributionWorkflow: {
            branchNaming: "feature/...",
            prProcess: "Pass tests",
            commitFormat: "Conventional Commits",
          },
        },
      });
      console.log(`✅ Seeded sample repository: ${sampleRepo.name} (${sampleRepo.id})`);
    } else {
      console.log("ℹ️ Sample repository already seeded.");
    }
  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}

export { seed };

