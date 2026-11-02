import fs from "fs";
import path from "path";
import os from "os";
import { simpleGit, SimpleGit, SimpleGitOptions } from "simple-git";
import { randomUUID } from "crypto";
import { ProviderError, ValidationError } from "@repomentor/shared";

export interface CloneOptions {
  url: string;
  branch?: string;
  timeoutMs?: number; // default: 60,000ms
  maxSizeMb?: number; // default: 100MB
  tempBaseDir?: string;
}

export interface ClonedResult {
  localPath: string;
  headCommitSha: string;
  totalSizeBytes: number;
}

/**
 * Calculates directory size in bytes recursively.
 */
export function getDirectorySizeBytes(dirPath: string): number {
  let total = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += getDirectorySizeBytes(full);
      } else if (entry.isFile()) {
        try {
          total += fs.statSync(full).size;
        } catch {
          // ignore stat errors
        }
      }
    }
  } catch {
    return 0;
  }
  return total;
}

/**
 * Safely removes a directory recursively.
 */
export async function cleanupClonedRepo(dirPath: string): Promise<void> {
  if (!dirPath || !fs.existsSync(dirPath)) return;
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch {
    // Retry once on Windows file lock transient delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
    } catch {
      // Ignored
    }
  }
}

/**
 * Performs an isolated, secure shallow clone of a GitHub repository with timeout and size enforcement.
 * NEVER executes any code inside the target repository.
 */
export async function cloneShallow(options: CloneOptions): Promise<ClonedResult> {
  const timeoutMs = options.timeoutMs ?? 60_000;
  const maxSizeMb = options.maxSizeMb ?? 100;
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  const tempBase = options.tempBaseDir || path.join(os.tmpdir(), "repomentor-clones");
  if (!fs.existsSync(tempBase)) {
    fs.mkdirSync(tempBase, { recursive: true });
  }

  const targetDir = path.join(tempBase, `clone-${Date.now()}-${randomUUID().slice(0, 8)}`);
  fs.mkdirSync(targetDir, { recursive: true });

  const gitOptions: Partial<SimpleGitOptions> = {
    baseDir: targetDir,
    binary: "git",
    maxConcurrentProcesses: 1,
    timeout: {
      block: timeoutMs,
    },
  };

  const git: SimpleGit = simpleGit(gitOptions);

  try {
    const cloneArgs = [
      "--depth",
      "1",
      "--single-branch",
      "--no-tags",
      "--no-recurse-submodules",
    ];

    if (options.branch) {
      cloneArgs.push("--branch", options.branch);
    }

    // Execute shallow clone
    await git.clone(options.url, targetDir, cloneArgs);

    // Verify repository size constraints
    const totalSizeBytes = getDirectorySizeBytes(targetDir);
    if (totalSizeBytes > maxSizeBytes) {
      throw new ValidationError(
        `Repository size (${Math.round(totalSizeBytes / (1024 * 1024))} MB) exceeds maximum allowed limit of ${maxSizeMb} MB.`
      );
    }

    // Get head commit SHA
    const log = await git.log({ maxCount: 1 });
    const headCommitSha = log.latest?.hash || "";

    return {
      localPath: targetDir,
      headCommitSha,
      totalSizeBytes,
    };
  } catch (error) {
    // Always clean up directory on failure
    await cleanupClonedRepo(targetDir);
    if (error instanceof ValidationError) {
      throw error;
    }
    const msg = error instanceof Error ? error.message : String(error);
    throw new ProviderError("GitClone", `Failed to clone repository: ${msg}`);
  }
}

