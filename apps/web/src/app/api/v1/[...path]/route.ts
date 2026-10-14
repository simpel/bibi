import { restHandler } from "@/server/handlers";

export const GET = (request: Request) => restHandler()(request);
export const POST = (request: Request) => restHandler()(request);
export const PATCH = (request: Request) => restHandler()(request);
export const DELETE = (request: Request) => restHandler()(request);
