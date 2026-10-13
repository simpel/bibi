import { chatHandler } from "@/server/assistant-handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Streaming turns can run up to 120 s (ASSISTANT_LIMITS.totalTimeoutMs).
export const maxDuration = 120;

export const POST = (request: Request) => chatHandler()(request);
