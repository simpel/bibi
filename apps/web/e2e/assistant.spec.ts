import { expect, test } from "@playwright/test";
import { listVenueNames, openAssistant, PANEL, sendChat, signUpWithOrganization } from "./steps";

const HISTORY_ROW = '[data-slot="conversation-row"]';

// Runs against the scripted mock model (E2E_MOCK_MODEL=1, see playwright.config.ts): "create venue
// <name>" proposes `venue_create`, "list venues" calls `venue_list`. Everything else is real:
// the chat route, the MCP server, the approval endpoint and the database.

test("a proposed venue needs approval: nothing is created until the user approves", async ({
  page,
}) => {
  await signUpWithOrganization({ page, name: "Assistent AB" });
  await openAssistant({ page });
  await expect(page.getByText("Vad kan jag hjälpa dig med?")).toBeVisible();

  await sendChat({ page, text: "create venue Test Hall" });
  const card = page.locator('[data-slot="approval-card"]');
  await expect(card).toBeVisible();
  await expect(card.getByText("Godkänn åtgärd")).toBeVisible();
  await expect(card.getByText('Create venue "Test Hall"')).toBeVisible();
  await expect(card.getByText("Skapa anläggning")).toBeVisible();
  await expect(card.getByText(/Gäller i \d+:\d\d/)).toBeVisible();
  expect(await listVenueNames({ page })).toEqual([]);

  await card.getByRole("button", { name: "Godkänn" }).click();
  await expect(card).toHaveAttribute("data-state", "approved");
  await expect(card.getByText("Godkänd")).toBeVisible();
  await expect(card.locator('[data-slot="venue-card"]').getByText("Test Hall")).toBeVisible();
  await expect(card.getByRole("button", { name: "Godkänn" })).toHaveCount(0);
  expect(await listVenueNames({ page })).toEqual(["Test Hall"]);

  await page
    .getByRole("navigation", { name: "Huvudnavigering" })
    .getByRole("link", { name: "Anläggningar" })
    .click();
  await expect(page.getByRole("link", { name: "Test Hall" }).first()).toBeVisible();
  await expect(page.locator(PANEL)).toHaveCount(0);

  // The decision is stored: reopening the conversation shows the card as approved, not pending.
  await page.goto("/");
  const panel = page.locator(PANEL);
  await page
    .getByRole("navigation", { name: "Assistent" })
    .getByRole("button", { name: "Ny chatt" })
    .click();
  await expect(card).toHaveCount(0);
  await page.goto("/sv/chats");
  await page.locator(HISTORY_ROW).first().getByRole("button").first().click();
  const restored = panel.locator('[data-slot="approval-card"]');
  await expect(restored).toHaveAttribute("data-state", "approved");
  await expect(restored.locator('[data-slot="venue-card"]').getByText("Test Hall")).toBeVisible();
});

test("rejecting a proposal creates nothing and locks the card", async ({ page }) => {
  await signUpWithOrganization({ page, name: "Avslag AB" });
  await openAssistant({ page });
  await sendChat({ page, text: "create venue Rejected Hall" });
  const card = page.locator('[data-slot="approval-card"]');
  await card.getByRole("button", { name: "Avslå" }).click();
  await expect(card).toHaveAttribute("data-state", "rejected");
  await expect(card.getByText("Avslagen")).toBeVisible();
  expect(await listVenueNames({ page })).toEqual([]);
});

test("a read tool renders as a venue table with links; history keeps the conversation", async ({
  page,
}) => {
  await signUpWithOrganization({ page, name: "Lista AB" });
  await page.request.post("/api/v1/venues", { data: { name: "The Hall", city: "Göteborg" } });
  await openAssistant({ page });
  await sendChat({ page, text: "list venues" });
  const table = page.locator('[data-slot="venue-table"]');
  await expect(table.getByRole("link", { name: "The Hall" })).toBeVisible();
  await expect(page.getByText("Klart. Se resultatet ovan.")).toBeVisible();
  await table.getByRole("link", { name: "The Hall" }).click();
  await expect(page).toHaveURL(/\/sv\/venues\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "The Hall" })).toBeVisible();

  // The full history is its own page (/chats): open, rename, archive or start a new one.
  const history = page.locator('[data-slot="assistant-history"]');
  await page.goto("/sv/chats");
  await expect(history.locator(HISTORY_ROW)).toHaveCount(1);
  await history.getByRole("button", { name: "Byt namn" }).click();
  await history.getByLabel("Konversationens namn").fill("My venues");
  await history.getByRole("button", { name: "Spara" }).click();
  await expect(history.getByText("My venues")).toBeVisible();

  await history.getByRole("button", { name: "Ny konversation" }).click();
  await expect(page.getByText("Vad kan jag hjälpa dig med?")).toBeVisible();
  await page.goto("/sv/chats");
  await history.getByText("My venues").click();
  await expect(page.locator(PANEL).locator('[data-slot="venue-table"]')).toBeVisible();

  await page.goto("/sv/chats");
  await history.getByRole("button", { name: "Arkivera konversation" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Arkivera konversation" }).click();
  await expect(history.getByText("Inga konversationer ännu.")).toBeVisible();
});

test("⌘K asks the assistant a one-shot question and opens the panel on it", async ({ page }) => {
  await signUpWithOrganization({ page, name: "Kommando AB" });
  await page.request.post("/api/v1/venues", { data: { name: "The Salon" } });
  await expect(page.locator(PANEL)).toHaveCount(0);

  await page.keyboard.press("Control+k");
  await page.getByPlaceholder("Sök eller skriv ett kommando...").fill("list venues");
  await expect(
    page.getByRole("option", { name: /Fråga assistenten: ”list venues”/ }),
  ).toBeVisible();
  await page.keyboard.press("Enter");

  await expect(page.locator(PANEL)).toBeVisible();
  await expect(page.locator(PANEL).getByText("list venues")).toBeVisible();
  await expect(
    page
      .locator(PANEL)
      .locator('[data-slot="venue-table"]')
      .getByRole("link", { name: "The Salon" }),
  ).toBeVisible();
});

test("English strings, and the assistant only lives on the start page", async ({ page }) => {
  await signUpWithOrganization({ page, name: "English AB" });
  await page.goto("/en/venues");
  await expect(page.locator(PANEL)).toHaveCount(0);
  await page.goto("/en");
  const panel = page.locator(PANEL);
  await expect(panel.getByText("What can I help you with?")).toBeVisible();
  await expect(panel.getByRole("button", { name: "Show all venues" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 800 });
  await page.getByRole("button", { name: "Show all venues" }).click();
  await expect(page.getByText(/scripted test assistant/)).toBeVisible();
});

test("the approval endpoint refuses an invalid token", async ({ page }) => {
  await signUpWithOrganization({ page, name: "Token AB" });
  const response = await page.request.post("/api/assistant/approval", {
    data: { decision: "approve", approvalToken: "not-a-real-token" },
  });
  expect(response.status()).toBe(403);
});
