import { notificationStreamResponse } from "@/server/notification-stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = (request: Request) => notificationStreamResponse(request);
