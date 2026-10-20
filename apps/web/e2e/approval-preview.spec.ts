import { expect, test } from "@playwright/test";
import { openAssistant, sendChat, signUpWithOrganization } from "./steps";

// Runs against the scripted mock model (E2E_MOCK_MODEL=1): "set capacity <item> <setup> <n>"
// proposes `item_update`. The preview on the card is computed by core (ADR 0049).

test("a capacity change shows before and after, and Confirm applies it (ADR 0049)", async ({
  page,
}) => {
  await signUpWithOrganization({ page, name: "Platser AB" });
  const post = async ({ path, data }: { path: string; data: object }) =>
    (await (await page.request.post(`/api/v1${path}`, { data })).json()) as { id: string };
  const setup = await post({ path: "/setups", data: { name: "Boardroom" } });
  const capabilities = ["BOOKABLE", "SETUPS"];
  const type = await post({
    path: "/entity-types",
    data: { base: "ITEM", name: "Room", capabilities },
  });
  const setups = [{ setupId: setup.id, capacity: 10 }];
  const item = await post({
    path: "/items",
    data: { entityTypeId: type.id, name: "Linnea", setups },
  });
  await openAssistant({ page });
  await sendChat({ page, text: `set capacity ${item.id} ${setup.id} 12` });
  const card = page.locator('[data-slot="approval-card"]');
  const changes = card.locator('[data-slot="approval-changes"]');
  await expect(changes.getByText("Boardroom")).toBeVisible();
  await expect(changes.getByText("10", { exact: true })).toBeVisible();
  await expect(changes.getByText("12", { exact: true })).toBeVisible();
  await expect(card.getByText("Kräver admin")).toBeVisible();
  await card.getByRole("button", { name: "Bekräfta" }).click();
  await expect(card).toHaveAttribute("data-state", "approved");
  const saved = await (await page.request.get(`/api/v1/items/${item.id}`)).json();
  expect(saved.setups).toEqual([{ setupId: setup.id, capacity: 12 }]);
});
