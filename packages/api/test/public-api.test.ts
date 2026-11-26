import {
  createDiningService,
  createEntityType,
  createExecuteContext,
  createItem,
  createLayout,
  type ExecuteContext,
  execute,
  importFloorElementKinds,
  listFloorElementKinds,
  PRESET_PERMISSIONS,
  saveLayout,
  setDiningRoom,
  updateBookingPage,
} from "@bibi/core";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { createPublicRestHandler, createRateLimiter } from "../src/index";

// biome-ignore lint/suspicious/noExplicitAny: loosely typed JSON for assertions
type Json = any;

async function run<T>({
  promise,
}: {
  promise: Promise<{ ok: boolean; value?: T; error?: Error }>;
}) {
  const result = await promise;
  if (!result.ok) throw result.error;
  return result.value as T;
}

/** A published dining room with one four-top and an every-day dinner sitting. */
async function publishedPage(): Promise<string> {
  const context: ExecuteContext = createExecuteContext({
    organizationId: `org_${createId()}`,
    actor: { type: "user", userId: `user_${createId()}` },
    roles: ["admin"],
    preset: "admin",
    permissions: PRESET_PERMISSIONS.admin,
    scopes: { kind: "all" } as never,
  });
  const exec = ({ operation, input }: { operation: unknown; input: unknown }) =>
    run<Json>({ promise: execute({ operation, input, context } as never) });
  const type = await exec({
    operation: createEntityType,
    input: {
      base: "ITEM",
      name: "Room",
      capabilities: ["BOOKABLE", "SETUPS", "PRICED"],
    },
  });
  const item = await exec({
    operation: createItem,
    input: {
      entityTypeId: type.id,
      name: "Kajen",
      maxPeople: 100,
    },
  });
  await exec({ operation: importFloorElementKinds, input: { template: "conference-banquet" } });
  const kinds = await exec({ operation: listFloorElementKinds, input: { limit: 100 } });
  const round = kinds.items.find((k: { name: string }) => k.name === "Round table Ø180");
  const layout = await exec({
    operation: createLayout,
    input: { itemId: item.id, name: "Dinner" },
  });
  await exec({
    operation: saveLayout,
    input: {
      id: layout.id,
      expectedVersion: 1,
      elements: [{ kindId: round.id, xCm: 150, yCm: 150, label: "1", maxCovers: 4 }],
    },
  });
  await exec({ operation: setDiningRoom, input: { itemId: item.id, slug: "kajen" } });
  await exec({
    operation: createDiningService,
    input: {
      ...{ roomItemId: item.id, layoutId: layout.id, name: "Dinner" },
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      ...{ firstStartMinute: 17 * 60, lastStartMinute: 21 * 60, slotMinutes: 30 },
      turnTimes: [{ upToParty: 20, minutes: 120 }],
      maxCoversPerSlot: 10,
    },
  });
  const slug = `api-${createId()}`.slice(0, 40);
  await exec({ operation: updateBookingPage, input: { slug, published: true } });
  return slug;
}

const base = "http://localhost/api/public/v1";
type CallInput = { method?: string; path: string; body?: unknown; ip?: string };

function caller({ handler }: { handler: (r: Request) => Promise<Response> }) {
  return async ({ method = "GET", path, body, ip = "1.1.1.1" }: CallInput) => {
    const response = await handler(
      new Request(`${base}${path}`, {
        method,
        headers: { "content-type": "application/json", "x-forwarded-for": ip },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
    return { response, json: (await response.json().catch(() => null)) as Json };
  };
}

function inDays({ days }: { days: number }): string {
  const when = new Date(Date.now() + days * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Stockholm" }).format(when);
}

describe("public REST API (ADR 0119)", () => {
  it("books, reads, changes and cancels with the manage token", async () => {
    const slug = await publishedPage();
    const call = caller({ handler: createPublicRestHandler({ rateLimiter: createRateLimiter() }) });

    const page = await call({ path: `/pages/${slug}` });
    expect(page.response.status).toBe(200);
    expect(page.response.headers.get("access-control-allow-origin")).toBe("*");
    expect(page.json.rooms[0].slug).toBe("kajen");

    const free = await call({
      path: `/pages/${slug}/rooms/kajen/availability?date=${inDays({ days: 3 })}&partySize=2`,
    });
    expect(free.response.status).toBe(200);
    const [first, second] = free.json.slots as { startsAt: string }[];
    expect(first).toBeDefined();

    const booked = await call({
      method: "POST",
      path: `/pages/${slug}/rooms/kajen/reservations`,
      body: {
        startsAt: first?.startsAt,
        partySize: 2,
        bookerName: "Anna Lind",
        bookerPhone: "070-1234567",
        bookerEmail: "anna@example.com",
        source: "WEB",
      },
    });
    expect(booked.response.status).toBe(201);
    expect(JSON.stringify(booked.json)).not.toMatch(/"id"/);
    const { token } = booked.json as { token: string };

    const got = await call({ path: `/reservations/${token}` });
    expect(got.json).toMatchObject({ partySize: 2, state: "BOOKED" });

    const changed = await call({
      method: "PATCH",
      path: `/reservations/${token}`,
      body: { partySize: 3, startsAt: (second ?? first)?.startsAt },
    });
    expect(changed.response.status).toBe(200);
    expect(changed.json.partySize).toBe(3);

    const cancelled = await call({
      method: "POST",
      path: `/reservations/${token}/cancel`,
      body: {},
    });
    expect(cancelled.json.state).toBe("CANCELLED");
  });

  it("answers unknown slugs and tokens with 404, bad input with 400, and preflight", async () => {
    const handler = createPublicRestHandler({ rateLimiter: createRateLimiter() });
    const call = caller({ handler });
    expect((await call({ path: "/pages/nope-nope" })).response.status).toBe(404);
    expect((await call({ path: "/reservations/not-a-token" })).response.status).toBe(404);
    expect((await call({ path: "/nothing" })).response.status).toBe(404);
    const doc = await call({ path: "/openapi.json" });
    expect(Object.keys(doc.json.paths)).toContain("/reservations/{token}");
    const preflight = await handler(new Request(`${base}/reservations/x`, { method: "OPTIONS" }));
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-methods")).toContain("PATCH");
  });

  it("limits requests per IP with 429 and Retry-After", async () => {
    const limits = { read: { perMinute: 2 }, write: { perMinute: 1 } };
    const call = caller({
      handler: createPublicRestHandler({ rateLimiter: createRateLimiter({ limits }) }),
    });
    expect((await call({ path: "/pages/a" })).response.status).toBe(404);
    expect((await call({ path: "/pages/a" })).response.status).toBe(404);
    const limited = await call({ path: "/pages/a" });
    expect(limited.response.status).toBe(429);
    expect(Number(limited.response.headers.get("retry-after"))).toBeGreaterThan(0);
    expect((await call({ path: "/pages/a", ip: "2.2.2.2" })).response.status).toBe(404);
  });
});

describe("rate limiter", () => {
  it("refills over time", () => {
    let time = 0;
    const limiter = createRateLimiter({
      limits: { read: { perMinute: 60 }, write: { perMinute: 10 } },
      now: () => time,
    });
    for (let i = 0; i < 10; i++)
      expect(limiter.take({ ip: "a", kind: "write" }).allowed).toBe(true);
    expect(limiter.take({ ip: "a", kind: "write" }).allowed).toBe(false);
    time = 6_000;
    expect(limiter.take({ ip: "a", kind: "write" }).allowed).toBe(true);
  });
});
