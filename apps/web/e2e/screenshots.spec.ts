import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { openAssistant, PANEL, sendChat, signUpWithOrganization } from "./steps";

// Visual review helper, not part of the regular suite: set E2E_SCREENSHOTS_DIR to a folder to
// get light/dark desktop and mobile screenshots of the assistant, approval card and skills.
const DIR = process.env.E2E_SCREENSHOTS_DIR;

type Mode = { name: string; scheme: "light" | "dark"; width: number; height: number };

const MODES: Mode[] = [
  { name: "desktop-light", scheme: "light", width: 1280, height: 800 },
  { name: "desktop-dark", scheme: "dark", width: 1280, height: 800 },
  { name: "mobile-light", scheme: "light", width: 390, height: 844 },
  { name: "mobile-dark", scheme: "dark", width: 390, height: 844 },
];

type ShotInput = { page: Page; mode: Mode; name: string };

async function shot({ page, mode, name }: ShotInput) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(DIR ?? ".", `${name}-${mode.name}.png`) });
}

async function seed({ page }: { page: Page }) {
  await page.request.post("/api/v1/venues", {
    data: { name: "Herrgården Solvik", city: "Göteborg", description: "Konferensgård vid sjön." },
  });
  await page.request.post("/api/v1/venues", { data: { name: "Aulan", city: "Lund" } });
  await page.request.post("/api/v1/skills", {
    data: {
      name: "Rundtur",
      description: "När en kund vill se lokalerna",
      instructions: "## Steg\n\n1. Lista **anläggningar**\n2. Visa rum\n\n> Fråga om datum.",
      allowedTools: ["venue_list", "item_list"],
    },
  });
}

async function openPanel({ page, mode }: { page: Page; mode: Mode }) {
  if (mode.width < 500) await page.getByRole("button", { name: "Öppna assistenten" }).click();
  else await openAssistant({ page });
  await expect(page.locator(PANEL)).toBeVisible();
}

async function assistantShots({ page, mode }: { page: Page; mode: Mode }) {
  await openPanel({ page, mode });
  await shot({ page, mode, name: "assistant-empty" });
  await sendChat({ page, text: "list venues" });
  await expect(page.locator('[data-slot="venue-table"]')).toBeVisible();
  await shot({ page, mode, name: "assistant-venue-table" });
  await sendChat({ page, text: "create venue Test Hall" });
  const card = page.locator('[data-slot="approval-card"]');
  await expect(card).toBeVisible();
  await shot({ page, mode, name: "approval-pending" });
  await card.getByRole("button", { name: "Godkänn" }).click();
  await expect(card).toHaveAttribute("data-state", "approved");
  await shot({ page, mode, name: "approval-approved" });
  await page.locator(PANEL).getByRole("button", { name: "Tidigare konversationer" }).click();
  await shot({ page, mode, name: "assistant-history" });
}

async function skillShots({ page, mode }: { page: Page; mode: Mode }) {
  await page.goto("/sv/skills");
  await expect(page.getByRole("link", { name: "Rundtur" })).toBeVisible();
  await shot({ page, mode, name: "skills-list" });
  await page.getByRole("link", { name: "Rundtur" }).click();
  await expect(page.getByRole("heading", { name: "Rundtur", level: 1 })).toBeVisible();
  await shot({ page, mode, name: "skill-detail" });
  await page.goto("/sv/skills/new");
  await shot({ page, mode, name: "skill-form" });
}

for (const mode of MODES) {
  test(`screenshots ${mode.name}`, async ({ page }) => {
    test.skip(!DIR, "set E2E_SCREENSHOTS_DIR to take screenshots");
    test.setTimeout(120_000);
    await page.emulateMedia({ colorScheme: mode.scheme });
    await page.setViewportSize({ width: mode.width, height: mode.height });
    await signUpWithOrganization({ page, name: "Solvik Konferens AB" });
    await seed({ page });
    await page.goto("/sv/venues");
    await shot({ page, mode, name: "venues" });
    await page.keyboard.press("Control+k");
    await page.getByPlaceholder("Sök eller skriv ett kommando...").fill("vilka lokaler finns");
    await shot({ page, mode, name: "command-bar" });
    await page.keyboard.press("Escape");
    await assistantShots({ page, mode });
    await skillShots({ page, mode });
  });
}
