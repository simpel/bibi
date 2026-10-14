import { graphqlHandler } from "@/server/handlers";

export const GET = (request: Request) => graphqlHandler()(request);
export const POST = (request: Request) => graphqlHandler()(request);
