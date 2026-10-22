import { fileResponse } from "@/server/file-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = (request: Request) => fileResponse(request);
