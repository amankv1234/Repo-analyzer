import fs from "fs";
import path from "path";
import { DependencyItem } from "@repomentor/shared";

export interface ParsedManifest {
  manifestFile: string;
  ecosystem: string;
  items: DependencyItem[];
}

/**
 * Parses dependencies from package.json
 */
export function parsePackageJson(filePath: string): ParsedManifest | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);
    const items: DependencyItem[] = [];

    if (json.dependencies) {
      for (const [name, version] of Object.entries(json.dependencies)) {
        items.push({ name, version: String(version), type: "runtime" });
      }
    }
    if (json.devDependencies) {
      for (const [name, version] of Object.entries(json.devDependencies)) {
        items.push({ name, version: String(version), type: "dev" });
      }
    }
    if (json.peerDependencies) {
      for (const [name, version] of Object.entries(json.peerDependencies)) {
        items.push({ name, version: String(version), type: "peer" });
      }
    }

    return {
      manifestFile: path.basename(filePath),
      ecosystem: "npm",
      items,
    };
  } catch {
    return null;
  }
}

/**
 * Parses Python requirements.txt
 */
export function parseRequirementsTxt(filePath: string): ParsedManifest | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const items: DependencyItem[] = [];
    const lines = raw.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) continue;

      const match = trimmed.match(/^([a-zA-Z0-9_.-]+)((?:[=><~^!]+.*)?)$/);
      if (match) {
        items.push({
          name: match[1]!,
          version: match[2]?.trim() || "any",
          type: "runtime",
        });
      }
    }

    return {
      manifestFile: path.basename(filePath),
      ecosystem: "pip",
      items,
    };
  } catch {
    return null;
  }
}

/**
 * Parses Cargo.toml (Rust)
 */
export function parseCargoToml(filePath: string): ParsedManifest | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const items: DependencyItem[] = [];
    let section: "none" | "dependencies" | "dev-dependencies" = "none";

    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      if (trimmed === "[dependencies]") {
        section = "dependencies";
        continue;
      } else if (trimmed === "[dev-dependencies]") {
        section = "dev-dependencies";
        continue;
      } else if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        section = "none";
        continue;
      }

      if (section !== "none") {
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const name = trimmed.substring(0, eqIdx).trim();
          const versionPart = trimmed.substring(eqIdx + 1).trim();
          let version = "any";
          const strMatch = versionPart.match(/["'](.*?)["']/);
          if (strMatch) {
            version = strMatch[1]!;
          }
          items.push({
            name,
            version,
            type: section === "dependencies" ? "runtime" : "dev",
          });
        }
      }
    }

    return {
      manifestFile: path.basename(filePath),
      ecosystem: "cargo",
      items,
    };
  } catch {
    return null;
  }
}

/**
 * Parses go.mod (Go)
 */
export function parseGoMod(filePath: string): ParsedManifest | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const items: DependencyItem[] = [];
    let inRequireBlock = false;

    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//")) continue;

      if (trimmed.startsWith("require (")) {
        inRequireBlock = true;
        continue;
      }
      if (inRequireBlock && trimmed === ")") {
        inRequireBlock = false;
        continue;
      }

      if (inRequireBlock) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          items.push({
            name: parts[0]!,
            version: parts[1]!,
            type: "runtime",
          });
        }
      } else if (trimmed.startsWith("require ")) {
        const parts = trimmed.substring(8).trim().split(/\s+/);
        if (parts.length >= 2) {
          items.push({
            name: parts[0]!,
            version: parts[1]!,
            type: "runtime",
          });
        }
      }
    }

    return {
      manifestFile: path.basename(filePath),
      ecosystem: "go",
      items,
    };
  } catch {
    return null;
  }
}

/**
 * Parses Maven pom.xml or Gradle build.gradle
 */
export function parseJavaManifest(filePath: string): ParsedManifest | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const items: DependencyItem[] = [];
    const baseName = path.basename(filePath);

    if (baseName === "pom.xml") {
      const depRegex = /<dependency>[\s\S]*?<groupId>(.*?)<\/groupId>[\s\S]*?<artifactId>(.*?)<\/artifactId>(?:[\s\S]*?<version>(.*?)<\/version>)?[\s\S]*?<\/dependency>/g;
      let match;
      while ((match = depRegex.exec(raw)) !== null) {
        items.push({
          name: `${match[1]}:${match[2]}`,
          version: match[3] || "managed",
          type: "runtime",
        });
      }
      return { manifestFile: baseName, ecosystem: "maven", items };
    }

    if (baseName.includes("gradle")) {
      const gradleRegex = /(?:implementation|api|testImplementation)\s+['"](.*?)['"]/g;
      let match;
      while ((match = gradleRegex.exec(raw)) !== null) {
        items.push({
          name: match[1]!,
          version: "any",
          type: "runtime",
        });
      }
      return { manifestFile: baseName, ecosystem: "gradle", items };
    }
    return null;
  } catch {
    return null;
  }
}
