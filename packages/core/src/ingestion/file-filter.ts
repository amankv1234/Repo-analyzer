import fs from "fs";
import path from "path";
import ignore from "ignore";

export interface FilteredFile {
  relativePath: string;
  absolutePath: string;
  language: string;
  sizeBytes: number;
}

export interface FileFilterOptions {
  maxFileSizeBytes?: number; // default: 1MB
  excludedDirectories?: string[];
  excludedExtensions?: string[];
}

const DEFAULT_EXCLUDED_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  "out",
  ".git",
  ".svn",
  ".hg",
  "vendor",
  "target",
  "bin",
  "obj",
  ".idea",
  ".vscode",
  "coverage",
  "__pycache__",
  ".pytest_cache",
  ".venv",
  "env",
  "venv",
  ".terraform",
]);

const DEFAULT_EXCLUDED_EXTENSIONS = new Set([
  // Binaries & Executables
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".bin",
  ".class",
  ".pyc",
  ".pyo",
  ".o",
  ".a",
  // Archives & Compressed
  ".zip",
  ".tar",
  ".gz",
  ".7z",
  ".rar",
  ".jar",
  ".war",
  // Images & Media
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".pdf",
  ".mp4",
  ".mp3",
  ".wav",
  // Fonts
  ".ttf",
  ".woff",
  ".woff2",
  ".eot",
  // Lockfiles (high token noise)
  ".lock",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "Cargo.lock",
  "poetry.lock",
  "composer.lock",
  "Gemfile.lock",
]);

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".py": "python",
  ".go": "go",
  ".rs": "rust",
  ".java": "java",
  ".c": "c",
  ".cpp": "cpp",
  ".cc": "cpp",
  ".cxx": "cpp",
  ".h": "c",
  ".hpp": "cpp",
  ".cs": "csharp",
  ".rb": "ruby",
  ".php": "php",
  ".swift": "swift",
  ".kt": "kotlin",
  ".scala": "scala",
  ".sql": "sql",
  ".sh": "bash",
  ".bash": "bash",
  ".zsh": "bash",
  ".json": "json",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "toml",
  ".xml": "xml",
  ".md": "markdown",
  ".mdx": "markdown",
  ".dockerfile": "dockerfile",
};

export function getFileLanguage(fileNameOrPath: string): string {
  const baseName = path.basename(fileNameOrPath).toLowerCase();
  if (baseName === "dockerfile") return "dockerfile";
  if (baseName === "makefile") return "makefile";

  const ext = path.extname(baseName).toLowerCase();
  return EXTENSION_TO_LANGUAGE[ext] ?? "plaintext";
}

/**
 * Checks if a file is minified by checking line length density.
 */
function isMinified(filePath: string): boolean {
  if (filePath.endsWith(".min.js") || filePath.endsWith(".min.css")) return true;
  try {
    const buffer = Buffer.alloc(2048);
    const fd = fs.openSync(filePath, "r");
    const bytesRead = fs.readSync(fd, buffer, 0, 2048, 0);
    fs.closeSync(fd);

    const sample = buffer.toString("utf8", 0, bytesRead);
    const lines = sample.split("\n");
    for (const line of lines) {
      if (line.length > 500) return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Recursively scans directory and applies security filters, gitignore rules, and size limits.
 */
export async function filterRepositoryFiles(
  repoDir: string,
  options: FileFilterOptions = {}
): Promise<FilteredFile[]> {
  const maxSizeBytes = options.maxFileSizeBytes ?? 1024 * 1024; // 1 MB default
  const filtered: FilteredFile[] = [];

  // Parse .gitignore if present in root
  const ig = ignore();
  const gitignorePath = path.join(repoDir, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    try {
      const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
      ig.add(gitignoreContent);
    } catch {
      // Ignore reading error if unreadable
    }
  }

  function scan(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(repoDir, fullPath).replace(/\\/g, "/");

      // Check directory exclusions
      if (entry.isDirectory()) {
        if (DEFAULT_EXCLUDED_DIRS.has(entry.name) || (ig && ig.ignores(relPath + "/"))) {
          continue;
        }
        scan(fullPath);
        continue;
      }

      // Check file exclusions
      if (entry.isFile()) {
        if (DEFAULT_EXCLUDED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
        if (DEFAULT_EXCLUDED_EXTENSIONS.has(entry.name.toLowerCase())) continue;
        if (ig && ig.ignores(relPath)) continue;

        try {
          const stat = fs.statSync(fullPath);
          if (stat.size > maxSizeBytes || stat.size === 0) continue;
          if (isMinified(fullPath)) continue;

          filtered.push({
            relativePath: relPath,
            absolutePath: fullPath,
            language: getFileLanguage(entry.name),
            sizeBytes: stat.size,
          });
        } catch {
          // Skip inaccessible file
        }
      }
    }
  }

  scan(repoDir);
  return filtered;
}

