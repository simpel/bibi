import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  SMTP_URL: z.string().default("smtp://localhost:1025"),
  MAIL_FROM: z.string().default("Okazi <no-reply@okazi.local>"),
  AI_GATEWAY_API_KEY: z.string().optional(),
  AI_DEFAULT_MODEL: z.string().default("anthropic/claude-sonnet-5-5"),
  AI_EMBEDDING_MODEL: z.string().default("openai/text-embedding-3-small"),
  WEB_URL: z.string().url().default("http://localhost:3000"),
  MCP_URL: z.string().url().default("http://localhost:3001"),
  /** Listen port of `apps/mcp` (Streamable HTTP). */
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  /** API key used by the stdio MCP server (`apps/mcp`), resolved once at startup. */
  OKAZI_API_KEY: z.string().min(1).optional(),
  /** OAuth client id of the web app (first-party); only it may act as `ai` actor. */
  WEB_OAUTH_CLIENT_ID: z.string().min(1).optional(),
  /** Runtime mode; `production` disables dev-only fallbacks (e.g. the placeholder embedder). */
  NODE_ENV: z.string().default("development"),
  /**
   * E2E ONLY: makes the web chat route use a scripted mock language model
   * (`apps/web/src/server/e2e-mock-model.ts`). Off by default; ignored when NODE_ENV=production.
   */
  E2E_MOCK_MODEL: z.stringbool().default(false),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** The only place in the codebase allowed to read `process.env`. */
export function getEnv(): Env {
  cached ??= envSchema.parse(process.env);
  return cached;
}
