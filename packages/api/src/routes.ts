import { conversationRoutes } from "./features/conversation/rest";
import { memberRoutes } from "./features/member/rest";
import { messageRoutes } from "./features/message/rest";
import { roleRoutes } from "./features/role/rest";
import { roomRoutes } from "./features/room/rest";
import { skillRoutes } from "./features/skill/rest";
import { venueRoutes } from "./features/venue/rest";
import type { RestRoute } from "./rest-route";
import { searchRoutes } from "./search-rest";

/** Every declared REST route; add a feature's routes here when it gets a `rest.ts`. */
export function listRestRoutes(): RestRoute[] {
  return [
    ...venueRoutes,
    ...roomRoutes,
    ...conversationRoutes,
    ...messageRoutes,
    ...skillRoutes,
    ...roleRoutes,
    ...memberRoutes,
    ...searchRoutes,
  ];
}

/** Unique names of the core operations exposed over REST (for the parity test). */
export function listRestOperationNames(): string[] {
  return [...new Set(listRestRoutes().map((route) => route.operation))].sort();
}
