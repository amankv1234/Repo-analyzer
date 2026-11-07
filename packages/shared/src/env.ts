import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

// Load .env from process.cwd() or monorepo root
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

export const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  // Server
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  API_BASE_URL: z.string().url().default("http://localhost:4000"),

  // Client
  NEXT_PUBLIC_API_URL: z.string().default("http://localhost:4000"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),

  // Database
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://repomentor:repomentor_dev_secret@localhost:5432/repomentor"),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // AI & Providers
  LLM_PROVIDER: z.enum(["gemini", "anthropic", "mock"]).default("gemini"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),
  ANTHROPIC_API_KEY: z.string().default("sk-ant-dummy-dev-key"),
  ANTHROPIC_MODEL_ANALYSIS: z.string().default("claude-3-5-sonnet-20241022"),
  ANTHROPIC_MODEL_FAST: z.string().default("claude-3-5-haiku-20241022"),

  EMBEDDING_PROVIDER: z.enum(["voyage", "local", "mock"]).default("voyage"),
  VOYAGE_API_KEY: z.string().default("pa-dummy-dev-key"),
  VOYAGE_MODEL: z.string().default("voyage-code-2"),
  EMBEDDING_DIMENSION: z.coerce.number().default(1536),

  // Ingestion Limits
  MAX_REPO_SIZE_MB: z.coerce.number().default(250),
  MAX_FILE_SIZE_KB: z.coerce.number().default(1024),
  CLONE_DEPTH: z.coerce.number().default(1),
  TEMP_STORAGE_PATH: z.string().default("/tmp/repomentor"),

  GITHUB_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let parsedEnv: Env;

export function getEnv(): Env {
  if (!parsedEnv) {
    const result = EnvSchema.safeParse(process.env);
    if (!result.success) {
      const formattedErrors = result.error.format();
      console.error("❌ Invalid environment variables:", JSON.stringify(formattedErrors, null, 2));
      throw new Error("Invalid environment configuration. Fix .env or export required variables.");
    }
    parsedEnv = result.data;
  }
  return parsedEnv;
}

export const env = getEnv();
