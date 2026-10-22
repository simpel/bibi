import { invitationMailHook } from "@bibi/auth";
import type { EmbedFn } from "@bibi/core";
import { createGraphqlHandler } from "@bibi/graphql";
import { resolveRelayedContext } from "./context-relay";

type Handler = (request: Request) => Promise<Response>;

const handlers = new WeakMap<EmbedFn, Handler>();

export type GetHandlerInput = { embed: EmbedFn };

/** One production-mode handler (no introspection/GraphiQL, depth+cost limits) per embed function. */
export function getGraphqlHandler({ embed }: GetHandlerInput): Handler {
  let handler = handlers.get(embed);
  if (!handler) {
    handler = createGraphqlHandler({
      embed,
      afterCommit: [invitationMailHook],
      development: false,
      resolveContext: resolveRelayedContext,
    });
    handlers.set(embed, handler);
  }
  return handler;
}
