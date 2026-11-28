import type { Page } from "@playwright/test";
import { call } from "./payment-fixtures";

type PageInput = { page: Page };

/** A day a few days ahead as `YYYY-MM-DD`, well inside any booking window. */
export function daysAhead({ days }: { days: number }) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

/** Two tables for two and one for four from the starter furniture, on a fresh layout. */
async function tablesLayout({ page, itemId }: PageInput & { itemId: string }) {
  const template = { template: "conference-banquet" };
  await call({ page, method: "post", path: "/floor-element-kinds/import", data: template });
  const kinds = await call({ page, method: "get", path: "/floor-element-kinds?limit=100" });
  const round = kinds.items.find((kind) => kind.name === "Round table Ø180");
  if (!round) throw new Error("the starter furniture has no round table");
  const layout = await call({
    page,
    method: "post",
    path: "/layouts",
    data: { itemId, name: "Dinner" },
  });
  const elements = [
    { kindId: round.id, xCm: 150, yCm: 150, label: "1", maxCovers: 2 },
    { kindId: round.id, xCm: 400, yCm: 150, label: "2", maxCovers: 2 },
    { kindId: round.id, xCm: 650, yCm: 150, label: "3", maxCovers: 4 },
  ];
  await call({
    page,
    method: "put",
    path: `/layouts/${layout.id}`,
    data: { expectedVersion: 1, elements },
  });
  return layout;
}

/**
 * A published booking page with the room "Kajen" (ADR 0119): an every-day Dinner sitting
 * 17:00–21:00 every 30 minutes, and an Allergens list guests may count. Built over REST as the
 * signed-in admin; returns the page slug, the room and the list's values.
 */
export async function publishedDiningRoom({ page }: PageInput) {
  const type = await call({
    page,
    method: "post",
    path: "/entity-types",
    data: { base: "ITEM", name: "Dining room", capabilities: ["BOOKABLE", "SETUPS"] },
  });
  const item = await call({
    page,
    method: "post",
    path: "/items",
    data: { entityTypeId: type.id, name: "Kajen", maxPeople: 40 },
  });
  const layout = await tablesLayout({ page, itemId: item.id });
  await call({ page, method: "put", path: `/dining-rooms/${item.id}`, data: { slug: "kajen" } });
  await call({
    page,
    method: "post",
    path: "/dining-services",
    data: {
      ...{ roomItemId: item.id, layoutId: layout.id, name: "Dinner" },
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      ...{ firstStartMinute: 17 * 60, lastStartMinute: 21 * 60, slotMinutes: 30 },
      turnTimes: [{ upToParty: 20, minutes: 120 }],
      maxCoversPerSlot: 10,
    },
  });
  const allergens = await call({
    page,
    method: "post",
    path: "/vocabularies",
    data: { name: "Allergens", values: ["Gluten", "Milk"] },
  });
  const slug = `e2e-${Date.now().toString(36)}`;
  await call({
    page,
    method: "patch",
    path: "/booking-page",
    data: { slug, published: true, guestListIds: [allergens.id] },
  });
  const list = await call({ page, method: "get", path: `/vocabularies/${allergens.id}` });
  return {
    slug,
    roomItemId: item.id,
    values: list.values as unknown as { id: string; name: string }[],
  };
}
