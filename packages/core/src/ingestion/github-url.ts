import { ValidationError } from "@repomentor/shared";

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  branch?: string;
  normalizedUrl: string;
}

/**
 * Strictly parses and validates GitHub URLs to prevent SSRF and path traversal attacks.
 * Allowed:
 *  - https://github.com/owner/repo
 *  - https://github.com/owner/repo.git
 *  - https://github.com/owner/repo/tree/branch-name
 *  - https://www.github.com/owner/repo
 *
 * Strict Rules:
 *  - Protocol MUST be https:
 *  - Host MUST be exactly "github.com" or "www.github.com"
 *  - Owner and Repo must match standard GitHub identifier constraints (alphanumeric, hyphen, underscore, dot)
 */
export function parseGitHubUrl(rawUrl: string): ParsedGitHubUrl {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new ValidationError("Repository URL must be a non-empty string");
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new ValidationError("Invalid repository URL format");
  }

  // 1. Strict Protocol Enforcement
  if (parsed.protocol !== "https:") {
    throw new ValidationError(
      `Insecure or unsupported protocol '${parsed.protocol}'. Only 'https:' is permitted to prevent SSRF.`
    );
  }

  // 2. Strict Host Enforcement (Reject IP addresses, internal domains, localhost, file://, etc.)
  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== "github.com" && hostname !== "www.github.com") {
    throw new ValidationError(
      `Unsupported Git host '${hostname}'. For security and SSRF mitigation, only 'github.com' is allowed.`
    );
  }

  // 3. Port Check (Must be standard 443 or default)
  if (parsed.port && parsed.port !== "443") {
    throw new ValidationError(`Non-standard port '${parsed.port}' is not permitted.`);
  }

  // 4. Path Parsing: /owner/repo or /owner/repo/tree/branch
  const segments = parsed.pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);

  if (segments.length < 2) {
    throw new ValidationError(
      "GitHub URL must include both owner and repository name: https://github.com/owner/repo"
    );
  }

  const rawOwner = segments[0]!;
  const rawRepo = segments[1]!.replace(/\.git$/i, "");

  // Validate owner and repo characters
  const validIdentifier = /^[a-zA-Z0-9_.-]+$/;
  if (!validIdentifier.test(rawOwner) || !validIdentifier.test(rawRepo)) {
    throw new ValidationError("Repository owner or name contains illegal characters");
  }

  let branch: string | undefined;
  if (segments.length >= 4 && segments[2] === "tree") {
    branch = segments.slice(3).join("/");
  }

  return {
    owner: rawOwner,
    repo: rawRepo,
    branch,
    normalizedUrl: `https://github.com/${rawOwner}/${rawRepo}`,
  };
}

