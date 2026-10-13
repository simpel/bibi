/**
 * Client-safe subpath (`@okazi/core/schemas`): ONLY the zod schema files of every feature.
 * No Prisma, fs or operation imports, so client components and `@okazi/ai/ui` can use them
 * without pulling the server into the browser bundle. Add each new feature's `schema.ts` here.
 */
export * from "./features/conversation/schema";
export * from "./features/message/schema";
export * from "./features/room/schema";
export * from "./features/skill/schema";
export * from "./features/venue/schema";
export * from "./search/search-schema";
