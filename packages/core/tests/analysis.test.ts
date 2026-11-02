import { describe, it, expect } from "vitest";
import {
  parseRequirementsTxt,
  parseCargoToml,
  parseGoMod,
} from "../src/analysis/dependency-parser";
import fs from "fs";
import path from "path";
import os from "os";

describe("Analysis: Dependency Manifest Parsers", () => {
  it("should parse Python requirements.txt accurately", () => {
    const tmp = path.join(os.tmpdir(), `req-${Date.now()}.txt`);
    fs.writeFileSync(
      tmp,
      `# Top-level dependencies\nfastapi>=0.100.0\nuvicorn==0.23.2\npydantic~=2.0\npytest\n# Comment\n-e .`
    );

    try {
      const res = parseRequirementsTxt(tmp);
      expect(res).not.toBeNull();
      expect(res?.ecosystem).toBe("pip");
      expect(res?.items).toHaveLength(4);
      expect(res?.items[0]?.name).toBe("fastapi");
      expect(res?.items[0]?.version).toBe(">=0.100.0");
      expect(res?.items[3]?.name).toBe("pytest");
    } finally {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    }
  });

  it("should parse Rust Cargo.toml dependencies and dev-dependencies", () => {
    const tmp = path.join(os.tmpdir(), `Cargo-${Date.now()}.toml`);
    fs.writeFileSync(
      tmp,
      `[package]\nname = "my-crate"\nversion = "0.1.0"\n\n[dependencies]\ntokio = "1.0"\nserde = { version = "1.0", features = ["derive"] }\n\n[dev-dependencies]\ntempfile = "3.2"`
    );

    try {
      const res = parseCargoToml(tmp);
      expect(res).not.toBeNull();
      expect(res?.ecosystem).toBe("cargo");
      expect(res?.items.length).toBeGreaterThanOrEqual(3);
      expect(res?.items.find((i) => i.name === "tokio")?.version).toBe("1.0");
      expect(res?.items.find((i) => i.name === "tempfile")?.type).toBe("dev");
    } finally {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    }
  });

  it("should parse Go go.mod require blocks", () => {
    const tmp = path.join(os.tmpdir(), `go-${Date.now()}.mod`);
    fs.writeFileSync(
      tmp,
      `module github.com/example/server\n\ngo 1.22\n\nrequire (\n\tgithub.com/gin-gonic/gin v1.9.1\n\tgo.uber.org/zap v1.26.0\n)\n`
    );

    try {
      const res = parseGoMod(tmp);
      expect(res).not.toBeNull();
      expect(res?.ecosystem).toBe("go");
      expect(res?.items).toHaveLength(2);
      expect(res?.items[0]?.name).toBe("github.com/gin-gonic/gin");
      expect(res?.items[0]?.version).toBe("v1.9.1");
    } finally {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    }
  });
});

