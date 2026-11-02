import { expect, test } from "@playwright/test";
import { gotoApp } from "./goto-app";
import { CUSTOMER, ITEM, PACKAGE, setUpIntake, submitRequest } from "./intake-fixtures";
import { createTicket, fillWhen, INTAKE_PATH, pickCustomer, pickPackage } from "./intake-steps";
import { signUpWithOrganization } from "./steps";

// The ticket intake (ADR 0081, 0084, 0085) end to end. Data comes from REST calls in a fresh
// organization (`intake-fixtures.ts`), as in the other specs; the demo seed shows the same flows
// by hand. Step 0 reads with the scripted draft model (`E2E_MOCK_MODEL`, ADR 0084).

test("flow A: a package for a seeded customer, review and Create", async ({ page }) => {
  await signUpWithOrganization({ page, name: "Intake A AB" });
  await setUpIntake({ page });
  await gotoApp({ page, path: INTAKE_PATH, locale: "en" });

  await pickCustomer({ page, name: "Kvarnby" });
  await fillWhen({ page, from: "10:00", to: "14:00", guests: 12 });
  await expect(page.getByRole("button", { name: new RegExp(PACKAGE) })).toBeVisible();
  await expect(page.getByText(/^Available .* for 12$/)).toBeVisible();
  await pickPackage({ page, name: PACKAGE });

  await expect(page.getByRole("heading", { name: "Review the booking" })).toBeVisible();
  await expect(page.getByText("Nothing is saved until Create.")).toBeVisible();
  await expect(page.getByRole("cell", { name: /Tasting room/ })).toBeVisible();
  await expect(page.getByRole("cell", { name: /Coffee and tea/ })).toBeVisible();
  await createTicket({ page });

  await expect(page.getByText(CUSTOMER).first()).toBeVisible();
  await expect(page.getByText("Tasting room").first()).toBeVisible();
  await expect(page.getByText("Coffee and tea").first()).toBeVisible();
});

test("flow B: a one-off for a new customer that looks like an existing one", async ({ page }) => {
  await signUpWithOrganization({ page, name: "Intake B AB" });
  await setUpIntake({ page });
  await gotoApp({ page, path: INTAKE_PATH, locale: "en" });

  await page.getByPlaceholder("Search customers by name").fill("KVARNBY DESIGN");
  await page.getByRole("option", { name: /New customer/ }).click();
  await expect(page.getByText(/looks like Kvarnby Design AB/)).toBeVisible();
  await page.getByRole("button", { name: "No, it is a new customer" }).click();
  await page.getByLabel(/^Contact name/).fill("Per Lind");
  await page.getByLabel(/^Contact email/).fill("per.lind@kvarnby-design.test");
  await page.getByRole("button", { name: "Create customer" }).click();
  await page.getByRole("button", { name: "Next: when" }).click();

  await fillWhen({ page, from: "09:00", to: "12:00", guests: 6 });
  await page.getByRole("button", { name: /^One-off/ }).click();
  await page.getByRole("button", { name: "Next: review" }).click();

  // No lines yet: Create waits for the answer, and adding a line answers it.
  await expect(page.getByText("There are no lines.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Answer 1 question first" })).toBeDisabled();
  await page.getByRole("button", { name: "+ Add a line", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Search items of every type").fill(ITEM);
  await dialog.getByRole("button", { name: new RegExp(ITEM) }).click();
  await dialog.getByRole("button", { name: "Add line", exact: true }).click();
  await expect(page.getByRole("cell", { name: new RegExp(ITEM) })).toBeVisible();
  await expect(page.getByText("There are no lines.")).toHaveCount(0);
  await createTicket({ page });

  await expect(page.getByText("KVARNBY DESIGN").first()).toBeVisible();
  await expect(page.getByText(ITEM).first()).toBeVisible();
});

test("flow C: from an inbox message, read by the assistant, checked and created", async ({
  page,
}) => {
  await signUpWithOrganization({ page, name: "Intake C AB" });
  const { endpointId } = await setUpIntake({ page });
  const { subject } = await submitRequest({ page, endpointId });
  await gotoApp({ page, path: "/inbox", locale: "en" });
  await page.getByRole("link", { name: subject }).click();
  await page.getByRole("link", { name: "New ticket from this message" }).click();
  await expect(page).toHaveURL(/\/new\/ticket\?fromMessage=/);

  await page.getByRole("button", { name: "Read the request" }).click();
  await expect(page.getByText("What the assistant read")).toBeVisible();
  await expect(page.getByText("14 people").first()).toBeVisible();

  // The customer, the contact and the time were read; the end time was guessed.
  await page.getByRole("button", { name: new RegExp(PACKAGE) }).click();
  await page.getByRole("button", { name: "Next: review" }).click();
  await expect(page.getByText(/The email doesn't say the end time/)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Answer 1 question first$/ })).toBeDisabled();
  await page.getByRole("button", { name: /^Keep / }).click();
  await createTicket({ page });

  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
  await expect(page.getByText(subject).first()).toBeVisible();
});
