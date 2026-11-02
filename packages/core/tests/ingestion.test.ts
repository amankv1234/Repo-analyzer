import { describe, it, expect } from "vitest";
import { parseGitHubUrl } from "../src/ingestion/github-url";
import { ValidationError } from "@repomentor/shared";

describe("Ingestion: GitHub URL Parser & SSRF Defenses", () => {
  it("should successfully parse valid GitHub URLs", () => {
    const res1 = parseGitHubUrl("https://github.com/facebook/react");
    expect(res1.owner).toBe("facebook");
    expect(res1.repo).toBe("react");
    expect(res1.branch).toBeUndefined();
    expect(res1.normalizedUrl).toBe("https://github.com/facebook/react");

    const res2 = parseGitHubUrl("https://github.com/torvalds/linux.git");
    expect(res2.owner).toBe("torvalds");
    expect(res2.repo).toBe("linux");

    const res3 = parseGitHubUrl("https://github.com/vercel/next.js/tree/canary");
    expect(res3.owner).toBe("vercel");
    expect(res3.repo).toBe("next.js");
    expect(res3.branch).toBe("canary");

    const res4 = parseGitHubUrl("https://www.github.com/org/repo");
    expect(res4.owner).toBe("org");
    expect(res4.repo).toBe("repo");
  });

  it("should reject non-HTTPS protocols to prevent SSRF and cleartext leaks", () => {
    expect(() => parseGitHubUrl("http://github.com/owner/repo")).toThrow(ValidationError);
    expect(() => parseGitHubUrl("file:///etc/passwd")).toThrow(ValidationError);
    expect(() => parseGitHubUrl("ftp://github.com/owner/repo")).toThrow(ValidationError);
    expect(() => parseGitHubUrl("gopher://github.com/owner/repo")).toThrow(ValidationError);
  });

  it("should reject hosts other than github.com to prevent SSRF", () => {
    expect(() => parseGitHubUrl("https://gitlab.com/owner/repo")).toThrow(ValidationError);
    expect(() => parseGitHubUrl("https://169.254.169.254/latest/meta-data")).toThrow(ValidationError);
    expect(() => parseGitHubUrl("https://localhost:5432/db")).toThrow(ValidationError);
    expect(() => parseGitHubUrl("https://evil-site.com/github.com/owner/repo")).toThrow(ValidationError);
  });

  it("should reject URLs with non-standard ports", () => {
    expect(() => parseGitHubUrl("https://github.com:8080/owner/repo")).toThrow(ValidationError);
  });

  it("should reject malformed URLs and invalid identifiers", () => {
    expect(() => parseGitHubUrl("not-a-url")).toThrow(ValidationError);
    expect(() => parseGitHubUrl("https://github.com/")).toThrow(ValidationError);
    expect(() => parseGitHubUrl("https://github.com/owner")).toThrow(ValidationError);
  });
});

