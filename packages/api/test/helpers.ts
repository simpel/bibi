import {
  appError,
  createCoreOperations,
  createExecuteContext,
  type ExecuteContext,
  err,
  ok,
  type Result,
} from "@okazi/core";
import { createId } from "@paralleldrive/cuid2";
import { createRestHandler } from "../src/index";
import { fakeEmbed } from "./fake-embed";

export const operations = createCoreOperations({ embed: fakeEmbed });

type ResolveInput = { headers: Headers };

/** Test auth: `x-test-org` (+ optional `x-test-roles`, `x-test-user`) selects the caller; no org → 401. */
async function resolveContext({ headers }: ResolveInput): Promise<Result<ExecuteContext>> {
  const organizationId = headers.get("x-test-org");
  if (!organizationId) {
    return err({ error: appError({ code: "UNAUTHENTICATED", message: "Sign in required" }) });
  }
  const roles = (headers.get("x-test-roles") ?? "owner").split(",");
  const userId = headers.get("x-test-user") ?? `user_${organizationId}`;
  const actor = { type: "user" as const, userId };
  return ok({ value: createExecuteContext({ organizationId, roles, actor }) });
}

export const handler = createRestHandler({ operations, resolveContext });

export function newOrgId(): string {
  return `org_${createId()}`;
}

export type CallInput = {
  method?: string;
  path: string;
  org?: string | null;
  roles?: string;
  user?: string;
  body?: unknown;
};
// biome-ignore lint/suspicious/noExplicitAny: loosely typed JSON for test assertions
export type Json = any;
export type CallOutput = { status: number; json: Json; response: Response };

/** Calls the handler like a real HTTP client would. */
export async function call({
  method = "GET",
  path,
  org = null,
  roles,
  user,
  body,
}: CallInput): Promise<CallOutput> {
  const headers = new Headers({ "content-type": "application/json" });
  if (org) headers.set("x-test-org", org);
  if (roles) headers.set("x-test-roles", roles);
  if (user) headers.set("x-test-user", user);
  const request = new Request(`http://localhost:3000/api/v1${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  });
  const response = await handler(request);
  const text = await response.text();
  return { status: response.status, json: text ? JSON.parse(text) : null, response };
}
