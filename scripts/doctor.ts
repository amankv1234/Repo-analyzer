import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import pg from "pg";

async function runDoctor() {
  console.log("==================================================");
  console.log("       RepoMentor Developer Environment Doctor     ");
  console.log("==================================================\n");

  let allHealthy = true;

  // 1. Check Node.js version
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split(".")[0] || "0", 10);
  if (major >= 22) {
    console.log(`✅ Node.js: ${nodeVersion} (Supported >= 22.x)`);
  } else {
    console.log(`❌ Node.js: ${nodeVersion} is unsupported. Please install Node.js 22 LTS.`);
    allHealthy = false;
  }

  // 2. Check pnpm
  try {
    const pnpmVer = execSync("pnpm -v", { encoding: "utf-8" }).trim();
    console.log(`✅ pnpm: v${pnpmVer} (Detected)`);
  } catch {
    console.log("❌ pnpm: Not found. Install via: npm install -g pnpm");
    allHealthy = false;
  }

  // 3. Check Docker
  try {
    const dockerInfo = execSync("docker info --format '{{.ServerVersion}}'", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    console.log(`✅ Docker Daemon: Running (Server v${dockerInfo.replace(/'/g, "")})`);
  } catch {
    console.log("⚠️  Docker: Daemon not responding. Ensure Docker Desktop is started.");
    console.log("   Remedy: Open Docker Desktop or run 'sudo systemctl start docker'");
    allHealthy = false;
  }

  // 4. Check .env configuration
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    console.log("✅ Environment: .env file found");
    const content = fs.readFileSync(envPath, "utf-8");
    if (content.includes("GEMINI_API_KEY") && !content.includes("placeholder")) {
      console.log("   Active Provider: Google Gemini (Free Tier)");
    } else if (content.includes("ANTHROPIC_API_KEY") && !content.includes("placeholder")) {
      console.log("   Active Provider: Anthropic Claude (Production Tier)");
    } else {
      console.log("   Active Provider: Mock Mode (Zero-key offline development)");
    }
  } else {
    console.log("⚠️  Environment: .env file not found.");
    console.log("   Remedy: Run 'cp .env.example .env'");
    allHealthy = false;
  }

  // 5. Check Database (PostgreSQL + pgvector)
  const dbUrl = process.env.DATABASE_URL || "postgresql://repomentor:repomentor_dev_secret@localhost:5432/repomentor";
  try {
    const client = new pg.Client({ connectionString: dbUrl, connectionTimeoutMillis: 2000 });
    await client.connect();
    const res = await client.query("SELECT extname FROM pg_extension WHERE extname = 'vector'");
    await client.end();

    if (res.rows.length > 0) {
      console.log("✅ PostgreSQL: Connected with pgvector extension enabled");
    } else {
      console.log("⚠️  PostgreSQL: Connected, but 'vector' extension is missing.");
      console.log("   Remedy: Run 'CREATE EXTENSION IF NOT EXISTS vector;' in Postgres.");
      allHealthy = false;
    }
  } catch (err) {
    console.log("⚠️  PostgreSQL: Could not connect to database.");
    console.log("   Remedy: Run 'pnpm docker:up' and 'pnpm --filter @repomentor/db db:migrate'");
  }

  console.log("\n==================================================");
  if (allHealthy) {
    console.log("🎉 All environment checks passed! You are ready to run: pnpm dev");
  } else {
    console.log("💡 Review any warnings above, apply remedies, and re-run: pnpm doctor");
  }
  console.log("==================================================\n");
}

runDoctor().catch((err) => {
  console.error("Doctor error:", err);
});

