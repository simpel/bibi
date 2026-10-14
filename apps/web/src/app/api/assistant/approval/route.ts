import { approvalHandler } from "@/server/assistant-handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = (request: Request) => approvalHandler()(request);
