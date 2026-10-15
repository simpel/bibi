export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness probe for the deploy gate (ADR 0013). No auth, no database, no request logging. */
export const GET = () => Response.json({ ok: true });
