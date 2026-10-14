import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { signUpWithOrganization } from "./steps";

test("create a personal skill, export it and import it back", async ({ page }) => {
  await signUpWithOrganization({ page, name: "Skills AB" });
  await page
    .getByRole("navigation", { name: "Huvudnavigering" })
    .getByRole("link", { name: "Färdigheter" })
    .click();
  await expect(page).toHaveURL(/\/sv\/skills$/);
  await expect(page.getByRole("heading", { name: "Färdigheter", level: 1 })).toBeVisible();

  await page.getByRole("link", { name: "Skapa färdighet" }).click();
  await page.getByLabel(/^Namn/).fill("Rundtur");
  await page.getByLabel(/^När ska den användas\?/).fill("När en kund vill se lokalerna");
  await page
    .getByLabel(/^Instruktioner \(markdown\)/)
    .fill("## Steg\n\n1. Lista **anläggningar**\n2. Visa rum");
  await page.getByLabel("Tillåtna verktyg").fill("venue_list item_list");
  await page.getByRole("button", { name: "Lägg till resurs" }).click();
  await page.getByLabel("Resursens namn").fill("checklista.md");
  await page.getByLabel("Innehåll").fill("- nycklar");
  await page.getByRole("button", { name: "Spara" }).click();

  await expect(page).toHaveURL(/\/sv\/skills\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Rundtur", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Steg" })).toBeVisible();
  await expect(page.getByText("anläggningar", { exact: true })).toBeVisible();
  await expect(page.getByText("venue_list")).toBeVisible();
  await expect(page.getByText("checklista.md")).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportera" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/SKILL\.md$/);
  const markdown = await readFile((await file.path()) ?? "", "utf8");
  expect(markdown).toContain("name: rundtur");
  expect(markdown).toContain('title: "Rundtur"');

  await page.getByRole("link", { name: "Tillbaka" }).click();
  await page.getByRole("button", { name: "Importera" }).click();
  const copy = markdown
    .replace("name: rundtur", "name: rundtur-kopia")
    .replace('"Rundtur"', '"Rundtur kopia"');
  await page.getByLabel("Fil (SKILL.md)").setInputFiles({
    name: "SKILL.md",
    mimeType: "text/markdown",
    buffer: Buffer.from(copy),
  });
  await expect(page.getByLabel("SKILL.md-innehåll")).toHaveValue(copy);
  await page.getByRole("dialog").getByRole("button", { name: "Importera" }).click();
  await expect(page.getByRole("heading", { name: "Rundtur kopia", level: 1 })).toBeVisible();
  await expect(page.getByText("Utkast").first()).toBeVisible();
  await expect(page.getByText("checklista.md")).toBeVisible();
});

test("edit, publish, filter and archive a skill; English strings", async ({ page }) => {
  await signUpWithOrganization({ page, name: "Skills Två AB" });
  await page.goto("/en/skills/new");
  await page.getByLabel(/^Name/).fill("Greeting");
  await page.getByLabel(/^When should it be used\?/).fill("When a guest arrives");
  await page.getByLabel(/^Instructions \(markdown\)/).fill("Say hello.");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Greeting", level: 1 })).toBeVisible();

  await page.getByRole("link", { name: "Edit skill" }).click();
  await page.getByLabel(/^Instructions \(markdown\)/).fill("Say hello warmly.");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Say hello warmly.")).toBeVisible();
  await expect(page.getByText("Version 2")).toBeVisible();

  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Published", { exact: true }).first()).toBeVisible();

  await page.getByRole("link", { name: "Back" }).click();
  await page.getByRole("searchbox", { name: "Search query" }).fill("Greeting");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=Greeting/);
  await expect(page.getByRole("link", { name: "Greeting" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create venue with items" })).toHaveCount(0);

  await page.getByRole("link", { name: "Greeting" }).click();
  await page.getByRole("button", { name: "Archive skill" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Archive skill" }).click();
  await expect(page).toHaveURL(/\/en\/skills$/);
  await expect(page.getByRole("link", { name: "Greeting" })).toHaveCount(0);
});
