import { CodeCitation } from "@repomentor/shared";

/**
 * Parses bracketed code citations from LLM Markdown output:
 * Example match: [src/routes/health.ts:15-30] or [packages/react/src/ReactHooks.js:25]
 */
export function extractCitationsFromMarkdown(markdownText: string): CodeCitation[] {
  const citationRegex = /\[([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+):(\d+)(?:-(\d+))?\]/g;
  const citations: CodeCitation[] = [];
  const seen = new Set<string>();

  let match;
  while ((match = citationRegex.exec(markdownText)) !== null) {
    const filePath = match[1]!;
    const startLine = parseInt(match[2]!, 10);
    const endLine = match[3] ? parseInt(match[3]!, 10) : startLine;

    const key = `${filePath}:${startLine}-${endLine}`;
    if (!seen.has(key)) {
      seen.add(key);
      citations.push({
        filePath,
        startLine,
        endLine,
      });
    }
  }

  return citations;
}

