import { resolveExecuteContext } from "@bibi/auth";
import { clearAiModelCache } from "@bibi/core";
import { getDb } from "@bibi/db";
import { captureLogs } from "@bibi/logger";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createChatHandler } from "../src/chat/create-chat-handler";
import { signUpWithOrg } from "./helpers/auth";
import { chatRequest } from "./helpers/chat";

// AiSetting is a global table in the shared dev database: remove the chat model, then restore.
let saved: Awaited<ReturnType<ReturnType<typeof getDb>["aiSetting"]["findMany"]>> = [];

beforeAll(async () => {
  saved = await getDb().aiSetting.findMany({ where: { feature: "assistant.chat" } });
  await getDb().aiSetting.deleteMany({ where: { feature: "assistant.chat" } });
  clearAiModelCache();
});

afterAll(async () => {
  if (saved.length > 0) await getDb().aiSetting.createMany({ data: saved });
  clearAiModelCache();
});

describe("createChatHandler – no model configured (ADR 0015)", () => {
  it("answers 503 UNAVAILABLE, logs an error and stores nothing", async () => {
    const user = await signUpWithOrg();
    const handler = createChatHandler({ resolveContext: resolveExecuteContext });
    const logs = captureLogs();
    const response = await handler(chatRequest({ cookies: user.cookies, text: "Hej" }));
    logs.restore();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "UNAVAILABLE" } });
    expect(logs.events({ event: "ai.modelNotConfigured" })[0]).toMatchObject({
      level: "error",
      feature: "assistant.chat",
    });
    const conversations = await getDb().conversation.count({
      where: { organizationId: user.organizationId },
    });
    expect(conversations).toBe(0);
  });
});
