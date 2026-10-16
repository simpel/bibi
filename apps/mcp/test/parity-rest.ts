import { createRestHandler } from "@okazi/api";
import { createCoreOperations, type ExecuteContext, ok } from "@okazi/core";
import { fakeEmbed } from "./fake-embed";
import type { Json } from "./helpers";

export type RestSendInput = { method: string; path: string; body?: Json };

export type RestClientInput = { context: ExecuteContext };

/** REST handler whose caller is always `context`. */
export function createRestClient({ context }: RestClientInput) {
  const handler = createRestHandler({
    operations: createCoreOperations({ embed: fakeEmbed }),
    resolveContext: async () => ok({ value: context }),
  });
  return {
    async get({ path }: { path: string }): Promise<Json> {
      const response = await handler(new Request(`http://localhost:3000/api/v1${path}`));
      if (response.status !== 200) throw new Error(`REST GET ${path}: ${response.status}`);
      return response.json();
    },
    /** Any method; returns the status instead of throwing, for permission checks. */
    async send({ method, path, body }: RestSendInput): Promise<number> {
      const init: RequestInit = { method, headers: { "content-type": "application/json" } };
      if (body !== undefined) init.body = JSON.stringify(body);
      return (await handler(new Request(`http://localhost:3000/api/v1${path}`, init))).status;
    },
  };
}
