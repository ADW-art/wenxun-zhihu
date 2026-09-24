import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  AUTH_TRUST_HOST: z.string().optional(),
  AGENT_PROVIDER: z.enum(["mock", "openai-compatible", "ollama"]).default("mock"),
  AGENT_MODEL: z.string().default("mock-conservation-agent"),
  AGENT_BASE_URL: z.string().default(""),
  AGENT_API_KEY: z.string().default(""),
  AGENT_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("uploads"),
  APP_URL: z.string().url().default("http://localhost:3000"),
});

export const env = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
  AGENT_PROVIDER: process.env.AGENT_PROVIDER,
  AGENT_MODEL: process.env.AGENT_MODEL,
  AGENT_BASE_URL: process.env.AGENT_BASE_URL,
  AGENT_API_KEY: process.env.AGENT_API_KEY,
  AGENT_TIMEOUT_MS: process.env.AGENT_TIMEOUT_MS,
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
  STORAGE_LOCAL_DIR: process.env.STORAGE_LOCAL_DIR,
  APP_URL: process.env.APP_URL,
});
