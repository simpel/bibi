export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** `${MCP_ORIGIN}/health` for the deploy gate and uptime checks (ADR 0104); same as `/api/health`. */
export const GET = () => Response.json({ ok: true });
