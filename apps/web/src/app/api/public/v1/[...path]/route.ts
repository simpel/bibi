import { publicRestHandler } from "@/features/guest-booking/server/public-rest-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Guests and partner sites (ADR 0119): no session or cookies, CORS open, rate limited per IP.
export const GET = (request: Request) => publicRestHandler()(request);
export const POST = (request: Request) => publicRestHandler()(request);
export const PATCH = (request: Request) => publicRestHandler()(request);
export const OPTIONS = (request: Request) => publicRestHandler()(request);
