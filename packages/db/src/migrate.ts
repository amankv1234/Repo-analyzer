import fs from "fs";
import path from "path";
import { pool } from "./client";

async function runMigrations() {
  console.log("🚀 Starting database migration...");
  const client = await pool.connect();

  try {
    const migrationFile = path.join(__dirname, "../drizzle/0000_initial_schema.sql");
    const sql = fs.readFileSync(migrationFile, "utf-8");

    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");

    console.log("✅ Database migrations applied successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

export { runMigrations };

