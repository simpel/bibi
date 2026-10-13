import { restHandler } from "@/server/handlers";

const handle = (request: Request) => restHandler()(request);

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
