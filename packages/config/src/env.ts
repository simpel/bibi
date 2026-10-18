import { z } from "zod";

const envSchema = z
  .object({
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    SMTP_URL: z.string().default("smtp://localhost:1025"),
    MAIL_FROM: z.string().default("Okazi <no-reply@okazi.local>"),
    /** Mail adapter (ADR 0012): `smtp` (Mailpit in dev, uses SMTP_URL) or `resend` (production). */
    MAIL_PROVIDER: z.enum(["smtp", "resend"]).default("smtp"),
    /** Resend API key; required when MAIL_PROVIDER=resend. Empty counts as unset. */
    RESEND_API_KEY: z.string().optional(),
    /** Signing secret (`whsec_...`) of the Resend inbound webhook; inbound mail is refused without it. */
    RESEND_WEBHOOK_SECRET: z.string().optional(),
    /**
     * Inbound subdomain for ticket reply addresses (`ticket-<id>@<domain>`, ADR 0012), e.g.
     * `in.okazi.se`. Unset: no reply address is shown and the inbound webhook answers 503.
     */
    MAIL_INBOUND_DOMAIN: z
      .string()
      .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i)
      .optional(),
    /** Platform Stripe secret key (`sk_...`) for Connect (ADR 0028); payment operations are UNAVAILABLE without it. */
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    /** Id of Okazi's own Stripe platform account (`acct_...`), recorded on every connected account. */
    STRIPE_PLATFORM_ACCOUNT_ID: z
      .string()
      .regex(/^acct_[A-Za-z0-9]+$/)
      .optional(),
    /** Signing secret (`whsec_...`) of the Stripe webhook endpoint (ADR 0028); the endpoint answers 503 without it. */
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    /**
     * Okazi's application fee on every payment, in basis points of the amount (250 = 2.5 %).
     * Unset or 0: no fee (ADR 0028; the pricing model is not decided yet).
     */
    STRIPE_APPLICATION_FEE_BPS: z.coerce.number().int().min(0).max(10_000).optional(),
    AI_GATEWAY_API_KEY: z.string().optional(),
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
    /** Minimum log level (ADR 0014). Default: `silent` when NODE_ENV=test, else `info`. */
    LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"]).optional(),
    /** `json` (one event per line) or `pretty`. Default: `json` in production, else `pretty`. */
    LOG_FORMAT: z.enum(["json", "pretty"]).optional(),
    /** Better Stack log source (ADR 0031): ingesting host and source token. Both set = logs are shipped. */
    BETTER_STACK_HOST: z.string().min(1).optional(),
    BETTER_STACK_SOURCE_TOKEN: z.string().min(1).optional(),
    /** Days the `SystemLog` table keeps rows for the admin view (ADR 0015). */
    SYSTEM_LOG_RETENTION_DAYS: z.coerce.number().int().min(1).max(365).default(30),
    /**
     * Days before personal values in `AuditLog.before`/`after` are redacted by the worker's
     * pseudonymisation job (ADR 0032). Rows themselves are kept 7 years.
     */
    AUDIT_LOG_PSEUDONYMISE_AFTER_DAYS: z.coerce.number().int().min(1).max(2555).default(365),
  })
  .refine((env) => Boolean(env.BETTER_STACK_HOST) === Boolean(env.BETTER_STACK_SOURCE_TOKEN), {
    message: "BETTER_STACK_HOST and BETTER_STACK_SOURCE_TOKEN must be set together",
    path: ["BETTER_STACK_SOURCE_TOKEN"],
  })
  .refine((env) => env.MAIL_PROVIDER !== "resend" || env.RESEND_API_KEY, {
    message: "RESEND_API_KEY is required when MAIL_PROVIDER=resend",
    path: ["RESEND_API_KEY"],
  });

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

type ParseEnvInput = { source: Record<string, string | undefined> };

/**
 * Validates an environment. Empty strings count as unset, so `${VAR:-}` in compose files falls back
 * to the schema default (or to "optional") instead of passing `""` through.
 */
export function parseEnv({ source }: ParseEnvInput): Env {
  const present = Object.entries(source).filter(([, value]) => value !== "");
  return envSchema.parse(Object.fromEntries(present));
}

/** The only place in the codebase allowed to read `process.env`. */
export function getEnv(): Env {
  cached ??= parseEnv({ source: process.env });
  return cached;
}
