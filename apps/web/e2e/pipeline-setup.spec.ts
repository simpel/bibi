import { expect, type Page, test } from "@playwright/test";
import { signUpWithOrganization } from "./steps";

/** Next step of the wizard, then waits for the step to be the current one. */
async function next({ page, step }: { page: Page; step: string }) {
  await page.getByRole("button", { name: "Nästa" }).click();
  await expect(page.locator('[aria-current="step"]')).toContainText(step);
}

test("an admin sets up the pipeline in the guided setup and previews it first", async ({
  page,
}) => {
  await signUpWithOrganization({ page, name: "Setup AB" });
  await page.goto("/sv/settings/pipeline");
  await page.getByRole("link", { name: "Guidad uppsättning" }).click();
  await expect(page).toHaveURL(/\/sv\/onboarding\/pipeline$/);

  await page.getByRole("button", { name: "Lägg till en ny typ" }).click();
  await page.getByLabel("Namn").fill("Room");
  await page.getByRole("checkbox", { name: "Kan bokas (håller artikeln, som en lokal)" }).click();

  await next({ page, step: "Statusar" });
  await expect(page.getByLabel("Statusens namn").first()).toHaveValue("Prebooked");

  await next({ page, step: "Faser" });
  await page.getByLabel("Utgå från").click();
  await page.getByRole("option", { name: "Konferensgård" }).click();
  await expect(page.getByLabel("Fasens namn").first()).toHaveValue("New");

  await next({ page, step: "Rutnätet" });
  await expect(page.getByRole("combobox", { name: "Confirmed: Room" })).toContainText("Booked");

  await next({ page, step: "Förhandsgranskning" });
  await expect(page.getByText("Klart att aktivera.")).toBeVisible();
  await expect(page.getByRole("img", { name: "Confirmed: Booked" })).toBeVisible();

  await next({ page, step: "Aktivera" });
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByText("Pipelinen har satts upp.")).toBeVisible();
  await expect(page).toHaveURL(/\/sv\/settings\/pipeline$/);
  await expect(
    page.getByRole("cell", { name: "Final count locked", exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "Lead", exact: true })).toHaveCount(0);
});
