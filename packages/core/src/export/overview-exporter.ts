import { RepoOverviewSections } from "@repomentor/shared";

/**
 * Exports a RepoOverview into a clean, comprehensive GitHub Flavored Markdown document.
 */
export function exportOverviewAsMarkdown(repoName: string, sections: RepoOverviewSections): string {
  const parts: string[] = [];

  parts.push(`# ${repoName} - Contributor Onboarding Guide\n`);
  parts.push(`> Generated automatically by [RepoMentor](https://repomentor.dev).\n`);

  // 1. Purpose & Problem
  parts.push(`## 1. Project Purpose & Summary\n`);
  parts.push(`${sections.summary}\n`);
  if (sections.purpose) {
    parts.push(`### Problem & Core Mission\n${sections.purpose}\n`);
  }

  // 2. Tech Stack
  if (sections.techStack && sections.techStack.length > 0) {
    parts.push(`## 2. Technology Stack & Rationale\n`);
    parts.push(`| Name | Category | Justification |`);
    parts.push(`| :--- | :--- | :--- |`);
    for (const item of sections.techStack) {
      parts.push(`| **${item.name}** | ${item.category} | ${item.justification} |`);
    }
    parts.push("");
  }

  // 3. Architecture
  if (sections.architecture) {
    parts.push(`## 3. Architecture Overview\n`);
    parts.push(`${sections.architecture.description}\n`);

    if (sections.architecture.mermaidDiagram) {
      parts.push("```mermaid");
      parts.push(sections.architecture.mermaidDiagram);
      parts.push("```\n");
    }
  }

  // 4. Folder Structure
  if (sections.folderStructure && sections.folderStructure.length > 0) {
    parts.push(`## 4. Key Directories & Modules\n`);
    for (const folder of sections.folderStructure) {
      parts.push(`- \`${folder.path}\`: ${folder.description}`);
    }
    parts.push("");
  }

  // 5. Local Setup
  if (sections.setupGuide) {
    parts.push(`## 5. Local Development Setup\n`);
    if (sections.setupGuide.prerequisites && sections.setupGuide.prerequisites.length > 0) {
      parts.push(`### Prerequisites`);
      for (const req of sections.setupGuide.prerequisites) {
        parts.push(`- ${req}`);
      }
      parts.push("");
    }

    if (sections.setupGuide.steps && sections.setupGuide.steps.length > 0) {
      parts.push(`### Setup Commands`);
      parts.push("```bash");
      for (const step of sections.setupGuide.steps) {
        parts.push(step);
      }
      parts.push("```\n");
    }

    if (sections.setupGuide.troubleshooting && sections.setupGuide.troubleshooting.length > 0) {
      parts.push(`### Troubleshooting`);
      for (const tip of sections.setupGuide.troubleshooting) {
        parts.push(`- ${tip}`);
      }
      parts.push("");
    }
  }

  // 6. Key Files
  if (sections.keyFiles && sections.keyFiles.length > 0) {
    parts.push(`## 6. Key Files (Recommended Reading Order)\n`);
    for (const f of sections.keyFiles) {
      parts.push(`${f.readOrder}. \`${f.path}\` - ${f.reason}`);
    }
    parts.push("");
  }

  // 7. Contribution Workflow
  if (sections.contributionWorkflow) {
    parts.push(`## 7. Contribution Workflow\n`);
    parts.push(`- **Branch Naming**: \`${sections.contributionWorkflow.branchNaming}\``);
    parts.push(`- **Commit Format**: \`${sections.contributionWorkflow.commitFormat}\``);
    parts.push(`- **Pull Request Process**: ${sections.contributionWorkflow.prProcess}\n`);
  }

  // 8. Pitfalls & Good First Areas
  if (sections.commonPitfalls && sections.commonPitfalls.length > 0) {
    parts.push(`## 8. Common Pitfalls\n`);
    for (const p of sections.commonPitfalls) {
      parts.push(`- ⚠️ ${p}`);
    }
    parts.push("");
  }

  if (sections.goodFirstAreas && sections.goodFirstAreas.length > 0) {
    parts.push(`## 9. Good First Contribution Areas\n`);
    for (const area of sections.goodFirstAreas) {
      parts.push(`- 💡 ${area}`);
    }
    parts.push("");
  }

  return parts.join("\n");
}

/**
 * Exports overview as an industry-standard CONTRIBUTING.md ready for committing to repo root.
 */
export function exportOverviewAsContributing(repoName: string, sections: RepoOverviewSections): string {
  const parts: string[] = [];

  parts.push(`# Contributing to ${repoName}\n`);
  parts.push(`Thank you for considering contributing! Please follow these guidelines to make the onboarding process smooth for everyone.\n`);

  parts.push(`## Development Workflow\n`);
  if (sections.contributionWorkflow) {
    parts.push(`1. **Branch Naming**: Use the pattern \`${sections.contributionWorkflow.branchNaming}\``);
    parts.push(`2. **Commit Convention**: Follow \`${sections.contributionWorkflow.commitFormat}\``);
    parts.push(`3. **Pull Request Protocol**: ${sections.contributionWorkflow.prProcess}\n`);
  }

  if (sections.setupGuide?.steps) {
    parts.push(`## Quick Local Setup\n`);
    parts.push("```bash");
    for (const step of sections.setupGuide.steps) {
      parts.push(step);
    }
    parts.push("```\n");
  }

  if (sections.codeConventions && sections.codeConventions.length > 0) {
    parts.push(`## Code Conventions\n`);
    for (const c of sections.codeConventions) {
      parts.push(`- ${c}`);
    }
    parts.push("");
  }

  if (sections.commonPitfalls && sections.commonPitfalls.length > 0) {
    parts.push(`## Important Rules & Pitfalls to Avoid\n`);
    for (const p of sections.commonPitfalls) {
      parts.push(`- ${p}`);
    }
    parts.push("");
  }

  return parts.join("\n");
}

