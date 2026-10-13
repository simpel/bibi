import { chromium } from "@playwright/test";

const dir = "/tmp/claude-0/-home-user-okazi/26ba3f6d-463c-589d-bc96-1803be1768f3/scratchpad/shots";
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox"],
});
const ctx = await browser.newContext({ locale: "sv-SE", viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
const shot = (n) => page.screenshot({ path: dir + "/" + n + ".png" });
await page.goto("http://localhost:3000/sv/login");
await shot("01-login");
await page.getByRole("tab", { name: "Engångskod" }).click();
await shot("02-login-otp");
await page.goto("http://localhost:3000/sv/sign-up");
await shot("03-signup");
const email = "shots-" + Date.now() + "@example.com";
await page.getByLabel("Namn").fill("Anna Lindqvist");
await page.getByLabel("E-post").fill(email);
await page.getByLabel("Lösenord").fill("shots-password-123");
await page.getByRole("button", { name: "Skapa konto" }).click();
await page.waitForURL(/select-organization/);
await page.waitForTimeout(500);
await shot("04-select-org");
await page.getByLabel("Organisationens namn").fill("World of Volvo");
await page.getByRole("button", { name: "Skapa organisation" }).click();
await page.waitForURL(/\/sv\/venues$/);
await page.waitForTimeout(500);
await shot("05-venues-empty");
for (const [n, c] of [
  ["Herrgården Solvik", "Göteborg"],
  ["Upplevelsecenter Volvo", "Göteborg"],
  ["Museum Västra", "Borås"],
]) {
  await page.getByRole("button", { name: "Skapa anläggning" }).first().click();
  if (n.startsWith("Herr")) await shot("06-venue-dialog");
  await page.getByLabel("Namn").fill(n);
  await page.getByLabel("Ort").fill(c);
  await page.getByRole("button", { name: "Spara" }).click();
  await page.getByRole("link", { name: n }).waitFor();
}
await page.waitForTimeout(500);
await shot("07-venues-list");
await page.getByRole("searchbox", { name: "Semantisk sökning" }).fill("Volvo");
await page.waitForTimeout(1200);
await shot("08-search");
await page.getByRole("searchbox", { name: "Semantisk sökning" }).fill("");
await page.waitForTimeout(600);
await page.getByRole("link", { name: "Herrgården Solvik", exact: true }).click();
await page.waitForTimeout(500);
await shot("09-detail-empty");
for (const [n, c] of [
  ["Stora salongen", "60"],
  ["Kabinettet", "12"],
]) {
  await page.getByRole("button", { name: "Skapa rum" }).first().click();
  if (n.startsWith("Stora")) await shot("10-room-dialog");
  await page.getByLabel("Namn").fill(n);
  await page.getByLabel("Max antal personer").fill(c);
  await page.getByRole("button", { name: "Spara" }).click();
  await page.getByRole("cell", { name: n }).waitFor();
}
await page.waitForTimeout(500);
await shot("11-detail-rooms");
await page.keyboard.press("Control+k");
await page.waitForTimeout(800);
await shot("12-command-bar");
await page.keyboard.press("Escape");
await page.getByRole("button", { name: "Tema" }).click();
await page.getByRole("menuitem", { name: "Mörkt" }).click();
await page.waitForTimeout(400);
await shot("13-dark-detail");
await page
  .getByRole("button", { name: "Organisation" })
  .first()
  .click()
  .catch(() => {});
await page.setViewportSize({ width: 390, height: 800 });
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
await shot("14-mobile-detail");
await page.getByRole("button", { name: "Öppna meny" }).click();
await page.waitForTimeout(400);
await shot("15-mobile-nav");
await browser.close();
