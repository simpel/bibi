import { EMBEDDING_DIMENSIONS, getDb, PLATFORM_SCOPE } from "@okazi/db";
import { captureLogs } from "@okazi/logger";
import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  AI_FEATURES,
  type AiModel,
  aiFeature,
  clearAiModelCache,
  createPlatformContext,
  createPlatformOperations,
  executePlatform,
  resolveAiModel,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";

const model = ({ id, type }: { id: string; type: AiModel["type"] }): AiModel => ({
  id,
  name: id,
  provider: id.split("/")[0] ?? "",
  type,
  description: null,
  contextWindow: null,
  inputPrice: null,
  outputPrice: null,
  tags: [],
});

const catalog = [
  model({ id: "anthropic/test-chat", type: "language" }),
  model({ id: "openai/test-embed", type: "embedding" }),
];
// Stand-in for the gateway catalog + probe: a feature’s possible models are those of its type.
const ops = createPlatformOperations({
  listCompatibleModels: async ({ feature }) =>
    catalog.filter((entry) => entry.type === aiFeature({ feature }).modelType),
});
const admin = createPlatformContext({
  actor: { type: "user", userId: `admin_${createId()}` },
  platformRole: "superadmin",
});
const nonAdmin = createPlatformContext({
  actor: { type: "user", userId: `user_${createId()}` },
  platformRole: null,
});

// AiSetting is a global table in the shared dev database: put back whatever was there.
let snapshot: Awaited<ReturnType<ReturnType<typeof getDb>["aiSetting"]["findMany"]>> = [];

beforeAll(async () => {
  snapshot = await getDb().aiSetting.findMany();
});

afterEach(async () => {
  await getDb().aiSetting.deleteMany();
  if (snapshot.length > 0) await getDb().aiSetting.createMany({ data: snapshot });
  clearAiModelCache();
});

describe("platform operations (ADR 0015)", () => {
  it("requires exactly the pgvector dimensions for embedding features", () => {
    const dims = AI_FEATURES.map((feature) => feature.requires.dimensions).filter(Boolean);
    expect(dims).toEqual([EMBEDDING_DIMENSIONS]);
  });

  it("refuses callers without the superadmin role", async () => {
    const result = await executePlatform({
      operation: ops.listAiFeatures,
      input: {},
      context: nonAdmin,
    });
    expect(errorCode({ result })).toBe("FORBIDDEN");
  });

  it("pages and filters the system log", async () => {
    const requestId = `req-${createId()}`;
    const base = { service: "test", requestId, data: {} };
    await getDb().systemLog.createMany({
      data: [
        { ...base, time: new Date(1000), level: "info", event: "a.done" },
        { ...base, time: new Date(2000), level: "warn", event: "b.rejected" },
        { ...base, time: new Date(3000), level: "error", event: "c.failed" },
      ],
    });
    const input = { requestId, level: "warn", pageSize: 1, page: 2 };
    const page = unwrap({
      result: await executePlatform({ operation: ops.listSystemLogs, input, context: admin }),
    });
    expect(page).toMatchObject({ total: 2, pageCount: 2, page: 2, pageSize: 1 });
    expect(page.items.map((item) => item.event)).toEqual(["b.rejected"]);
  });

  it("only accepts a catalog model of the feature's type, and audits the change", async () => {
    const wrongType = await executePlatform({
      operation: ops.updateAiFeature,
      input: { feature: "assistant.chat", modelId: "openai/test-embed" },
      context: admin,
    });
    expect(errorCode({ result: wrongType })).toBe("VALIDATION");
    const saved = unwrap({
      result: await executePlatform({
        operation: ops.updateAiFeature,
        input: { feature: "assistant.chat", modelId: "anthropic/test-chat" },
        context: admin,
      }),
    });
    expect(saved).toMatchObject({ modelId: "anthropic/test-chat", updatedBy: admin.actor.userId });
    const [row] = await getDb().auditLog.findMany({
      where: { organizationId: PLATFORM_SCOPE, actorId: admin.actor.userId },
    });
    expect(row).toMatchObject({ operation: "aiFeature.update", entityId: "assistant.chat" });
  });

  it("fails with UNAVAILABLE and an error log while a feature has no model", async () => {
    await getDb().aiSetting.deleteMany({ where: { feature: "assistant.chat" } });
    const logs = captureLogs();
    const missing = await resolveAiModel({ feature: "assistant.chat" });
    logs.restore();
    expect(errorCode({ result: missing })).toBe("UNAVAILABLE");
    const [line] = logs.events({ event: "ai.modelNotConfigured" });
    expect(line).toMatchObject({ level: "error", feature: "assistant.chat" });
  });

  it("resolves the admin's choice at runtime", async () => {
    await executePlatform({
      operation: ops.updateAiFeature,
      input: { feature: "assistant.chat", modelId: "anthropic/test-chat" },
      context: admin,
    });
    const resolved = await resolveAiModel({ feature: "assistant.chat" });
    expect(unwrap({ result: resolved })).toBe("anthropic/test-chat");
  });
});
