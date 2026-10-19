import { expect, type Page, test } from "@playwright/test";
import { signUpWithOrganization } from "./steps";

// Runs against the scripted mock model (E2E_MOCK_MODEL=1): on /onboarding it loads the
// first-setup skill, asks three questions, takes a preset draft and previews it (ADR 0045).

const OPEN_QUESTION = '[data-slot="questionnaire-card"][data-open="true"]';

type AnswerInput = { page: Page; choice: string; role?: "radio" | "checkbox" };

/** Picks one answer (or ticks several, comma-separated) and sends it as the next chat message. */
async function answer({ page, choice, role = "radio" }: AnswerInput) {
  const card = page.locator(OPEN_QUESTION);
  await expect(card).toHaveCount(1);
  for (const name of choice.split(", ")) {
    const input = card.getByRole(role, { name });
    await input.check();
    await expect(input).toBeChecked();
  }
  await card.getByRole("button", { name: "Svara" }).click();
  await expect(page.getByText(choice, { exact: true }).last()).toBeVisible();
}

test("three answered questions lead to a first version that is ready", async ({ page }) => {
  await signUpWithOrganization({ page, name: "Första AB" });
  await page.goto("/sv/onboarding");
  await page.getByRole("button", { name: "Nu sätter vi igång" }).click();

  await expect(page.getByText("What kind of place do you run?", { exact: true })).toBeVisible();
  await answer({ page, choice: "A conference venue" });
  await expect(page.getByText("What do you sell?", { exact: true })).toBeVisible();
  await answer({ page, choice: "Rooms, Food and drink", role: "checkbox" });
  await expect(
    page.getByText("Do your customers usually get a quote before they book?", { exact: true }),
  ).toBeVisible();
  await answer({ page, choice: "Yes, a quote first" });

  // The draft shows only in the panel next to the chat, never as a card in the chat.
  await expect(page.locator('[data-slot="pipeline-draft-card"]')).toHaveCount(0);
  const panel = page.locator('[data-slot="setup-panel"]');
  await expect(panel.getByText("Det ni säljer")).toBeVisible();
  await expect(panel.getByText("Conference room")).toBeVisible();
  await expect(page.getByText("Here is a first version. Nothing is saved yet.")).toBeVisible();
  // The follow-ups only show once the preview reported the draft as ready.
  await expect(page.getByRole("button", { name: "Ser bra ut" })).toBeVisible();
  await expect(page.locator(OPEN_QUESTION)).toHaveCount(0);
});

test("approving the first version saves it and opens the board", async ({ page }) => {
  await signUpWithOrganization({ page, name: "Andra AB" });
  await page.goto("/sv/onboarding");
  await page.getByRole("button", { name: "Nu sätter vi igång" }).click();
  await answer({ page, choice: "A conference venue" });
  await answer({ page, choice: "Rooms, Food and drink", role: "checkbox" });
  await answer({ page, choice: "Yes, a quote first" });
  await page.getByRole("button", { name: "Ser bra ut" }).click();

  const card = page.locator('[data-slot="setup-approval-card"]');
  await card.getByRole("button", { name: "Skapa min första version" }).click();
  await expect(page).toHaveURL(/\/pipeline$/);
});
