import { mcpHandler } from "@/server/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The MCP server (ADR 0104). POST carries the protocol; GET and DELETE answer 405, OPTIONS is CORS.
export const POST = (request: Request) => mcpHandler()(request);
export const GET = (request: Request) => mcpHandler()(request);
export const DELETE = (request: Request) => mcpHandler()(request);
export const OPTIONS = (request: Request) => mcpHandler()(request);
