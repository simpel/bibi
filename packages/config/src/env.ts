import { z } from "zod";

/**
 * An origin (`scheme://host[:port]`, no path or trailing slash). Paths are built from it, so a
 * `*_ORIGIN` must never carry one; a full URL used as-is is a `*_URL`.
 */
const origin = z
  .string()
  .url()
  .refine(
    (value) => new URL(value).origin === value,
    "must be an origin: scheme://host[:port], no path",
  );

const S3_REQUIRED = ["S3_REGION", "S3_BUCKET", "S3_ACCESS_KEY", "S3_SECRET_KEY"] as const;
/** Each provider's hosts come only from env, required once its credentials are set. */
const PROVIDER_HOSTS = {
  STRIPE_SECRET_KEY: ["STRIPE_API_BASE_URL"],
  FORTNOX_CLIENT_ID: ["FORTNOX_AUTH_BASE_URL", "FORTNOX_API_BASE_URL"],
  VISMA_CLIENT_ID: ["VISMA_IDENTITY_BASE_URL", "VISMA_API_BASE_URL"],
} as const;

const envSchema = z
  .object({
    DATABASE_URL: z.string().url(),
    /**
     * Connections in this process's `pg` pool (ADR 0097). The sum over web and worker, plus
     * the notification `LISTEN` connection, stays below Postgres `max_connections`.
     */
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    SMTP_URL: z.string().default("smtp://localhost:1025"),
    MAIL_FROM: z.string().default("Bibi <no-reply@bibi.local>"),
    /** Mail adapter (ADR 0012): `smtp` (Mailpit in dev, uses SMTP_URL) or `resend` (production). */
    MAIL_PROVIDER: z.enum(["smtp", "resend"]).default("smtp"),
    /** File storage adapter (ADR 0063): `disk` (dev and tests) or `s3` (any S3-compatible service). */
    STORAGE_DRIVER: z.enum(["disk", "s3"]).default("disk"),
    /** Root directory of the `disk` adapter; relative paths resolve from the repo root. */
    STORAGE_DISK_DIR: z.string().default("./.storage"),
    /** S3 settings; all but the endpoint are required when STORAGE_DRIVER=s3. */
    S3_ENDPOINT: z.string().url().optional(),
    S3_REGION: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY: z.string().optional(),
    S3_SECRET_KEY: z.string().optional(),
    /** Resend API key; required when MAIL_PROVIDER=resend. Empty counts as unset. */
    RESEND_API_KEY: z.string().optional(),
    /** Signing secret (`whsec_...`) of the Resend inbound webhook; inbound mail is refused without it. */
    RESEND_WEBHOOK_SECRET: z.string().optional(),
    /**
     * Inbound subdomain for order reply addresses (`order-<id>@<domain>`, ADR 0012), e.g.
     * `in.heybibi.se`. Unset: no reply address is shown and the inbound webhook answers 503.
     */
    MAIL_INBOUND_DOMAIN: z
      .string()
      .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i)
      .optional(),
    /**
     * Stripe API root without a version (`https://api.stripe.com`); calls add `/v1` or `/v2`.
     * Required with `STRIPE_SECRET_KEY`; Bibi's own billing (key in `BillingConfig`) needs it too.
     */
    STRIPE_API_BASE_URL: z.string().url().optional(),
    /** Platform Stripe secret key (`sk_...`) for Connect (ADR 0028); payment operations are UNAVAILABLE without it. */
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    /** Id of Bibi's own Stripe platform account (`acct_...`), recorded on every connected account. */
    STRIPE_PLATFORM_ACCOUNT_ID: z
      .string()
      .regex(/^acct_[A-Za-z0-9]+$/)
      .optional(),
    /** Signing secret (`whsec_...`) of the Stripe webhook endpoint (ADR 0028); the endpoint answers 503 without it. */
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    /**
     * Bibi's application fee on every payment, in basis points of the amount (250 = 2.5 %).
     * Unset or 0: no fee (ADR 0028; the pricing model is not decided yet).
     */
    STRIPE_APPLICATION_FEE_BPS: z.coerce.number().int().min(0).max(10_000).optional(),
    /** Fortnox app credentials (ADR 0087); both set or neither. Unset: Fortnox is not configured. */
    FORTNOX_CLIENT_ID: z.string().min(1).optional(),
    FORTNOX_CLIENT_SECRET: z.string().min(1).optional(),
    /** Fortnox OAuth host (`https://apps.fortnox.se`); calls add `/oauth-v1/...`. Required with the client. */
    FORTNOX_AUTH_BASE_URL: z.string().url().optional(),
    /** Fortnox API host (`https://api.fortnox.se`); calls add `/3`. Required with the client. */
    FORTNOX_API_BASE_URL: z.string().url().optional(),
    /**
     * Spiris (Visma eEkonomi) partner client (ADR 0100): id and secret together, and both hosts
     * with them. Unset: Visma is not configured. Sandbox and production share the hosts `https://identity.vismaonline.com` and
     * `https://eaccountingapi.vismaonline.com`; the client decides which companies it reaches.
     */
    VISMA_CLIENT_ID: z.string().min(1).optional(),
    VISMA_CLIENT_SECRET: z.string().min(1).optional(),
    /** Visma Connect (OAuth) host. */
    VISMA_IDENTITY_BASE_URL: z.string().url().optional(),
    /** eAccounting API root, without `/v2`. */
    VISMA_API_BASE_URL: z.string().url().optional(),
    /**
     * Swish for merchants API root (ADR 0100), up to and including `/swish-cpcapi`: the Merchant
     * Swish Simulator `https://mss.cpc.getswish.net/swish-cpcapi`, production
     * `https://cpc.getswish.net/swish-cpcapi`. Unset: Swish is not configured.
     */
    SWISH_API_BASE_URL: z.string().url().optional(),
    /** Base64 32-byte key sealing integration tokens at rest (ADR 0087). Unset: no integration can connect. */
    INTEGRATION_SECRET_KEY: z
      .string()
      .refine((value) => Buffer.from(value, "base64").length === 32, "must be 32 bytes, base64")
      .optional(),
    AI_GATEWAY_API_KEY: z.string().optional(),
    WEB_ORIGIN: origin.default("http://localhost:3330"),
    /**
     * Public site on its own host (ADR 0073), e.g. `https://heybibi.se`, while `WEB_ORIGIN` is the app host.
     * Unset: one host serves everything and the public site is only reachable at `/<locale>/site`.
     */
    PUBLIC_ORIGIN: origin.optional(),
    /** Address shown on the public `/support` page. Unset: the page points to the assistant and admins only. */
    SUPPORT_EMAIL: z.string().email().optional(),
    /**
     * Public origin of MCP; its endpoint and OAuth resource are `${MCP_ORIGIN}/mcp`, served by the web app
     * (ADR 0104). In production its own host (`https://mcp.<domain>`); unset = `WEB_ORIGIN`.
     */
    MCP_ORIGIN: origin.optional(),
    /** Storybook of `@bibi/ui` (`pnpm --filter @bibi/ui dev`), shown in the dev banner. */
    STORYBOOK_URL: z.string().url().default("http://localhost:3332"),
    /** API key used by the stdio MCP server (`apps/mcp`), resolved once at startup. */
    BIBI_API_KEY: z.string().min(1).optional(),
    /** OAuth client id of the web app (first-party); only it may act as `ai` actor. */
    WEB_OAUTH_CLIENT_ID: z.string().min(1).optional(),
    /** Runtime mode; `production` disables dev-only fallbacks (e.g. the placeholder embedder). */
    NODE_ENV: z.string().default("development"),
    /**
     * E2E ONLY: makes the web chat route use a scripted mock language model
     * (`apps/web/src/server/e2e-mock-model.ts`). Off by default; ignored when NODE_ENV=production.
     */
    E2E_MOCK_MODEL: z.stringbool().default(false),
    /**
     * E2E only: Stripe and Swish replaced by in-memory providers that accept unsigned test
     * deliveries (`installE2eProviders`). Off by default; ignored when NODE_ENV=production.
     */
    E2E_MEMORY_PROVIDERS: z.stringbool().default(false),
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
  .refine((env) => Boolean(env.FORTNOX_CLIENT_ID) === Boolean(env.FORTNOX_CLIENT_SECRET), {
    message: "FORTNOX_CLIENT_ID and FORTNOX_CLIENT_SECRET must be set together",
    path: ["FORTNOX_CLIENT_SECRET"],
  })
  .refine((env) => Boolean(env.VISMA_CLIENT_ID) === Boolean(env.VISMA_CLIENT_SECRET), {
    message: "VISMA_CLIENT_ID and VISMA_CLIENT_SECRET must be set together",
    path: ["VISMA_CLIENT_SECRET"],
  })
  .superRefine((env, ctx) => {
    for (const [credential, hosts] of Object.entries(PROVIDER_HOSTS)) {
      if (!env[credential as keyof typeof PROVIDER_HOSTS]) continue;
      for (const key of hosts) {
        if (env[key]) continue;
        ctx.addIssue({
          code: "custom",
          message: `${key} is required with ${credential}`,
          path: [key],
        });
      }
    }
  })
  .refine((env) => env.MAIL_PROVIDER !== "resend" || env.RESEND_API_KEY, {
    message: "RESEND_API_KEY is required when MAIL_PROVIDER=resend",
    path: ["RESEND_API_KEY"],
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_DRIVER !== "s3") return;
    for (const key of S3_REQUIRED) {
      if (env[key]) continue;
      ctx.addIssue({
        code: "custom",
        message: `${key} is required when STORAGE_DRIVER=s3`,
        path: [key],
      });
    }
  });

export type Env = z.output<typeof envSchema> & { MCP_ORIGIN: string };

let cached: Env | undefined;

type ParseEnvInput = { source: Record<string, string | undefined> };

/**
 * Validates an environment. Empty strings count as unset, so `${VAR:-}` in compose files falls back
 * to the schema default (or to "optional") instead of passing `""` through.
 */
export function parseEnv({ source }: ParseEnvInput): Env {
  const present = Object.entries(source).filter(([, value]) => value !== "");
  const env = envSchema.parse(Object.fromEntries(present));
  return { ...env, MCP_ORIGIN: env.MCP_ORIGIN ?? env.WEB_ORIGIN };
}

/** The only place in the codebase allowed to read `process.env`. */
export function getEnv(): Env {
  cached ??= parseEnv({ source: process.env });
  return cached;
}
