import { chromium } from "@playwright/test";
import { createHash, randomBytes } from "node:crypto";
const clientId = "okazi-web-syq92817mx670a7zjpdjyjei";
const verifier = randomBytes(32).toString("base64url");
const challenge = createHash("sha256").update(verifier).digest("base64url");
const authorize = "http://localhost:3000/api/auth/oauth2/authorize?" + new URLSearchParams({
  response_type: "code", client_id: clientId, redirect_uri: "http://localhost:3000/api/assistant/oauth/callback",
  scope: "openid offline_access", state: "s1", code_challenge: challenge, code_challenge_method: "S256",
  resource: "http://localhost:3001/mcp" });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const page = await (await browser.newContext({ locale: "sv-SE" })).newPage();
const log = [];
page.on("framenavigated", (f) => f === page.mainFrame() && log.push(f.url().replace("http://localhost:3000","").slice(0,110)));
// sign up first (no org) in a separate step so the session has no active org
const email = "oauth-" + Date.now() + "@example.com";
await page.goto("http://localhost:3000/sv/sign-up");
await page.getByLabel("Namn").fill("OAuth Tester"); await page.getByLabel("E-post").fill(email);
await page.getByLabel("Lösenord").fill("oauth-password-123"); await page.getByRole("button", { name: "Skapa konto" }).click();
await page.waitForURL(/select-organization/);
log.length = 0;
await page.goto(authorize);
await page.waitForTimeout(2500);
console.log("1 (no org):", log.join(" -> "));
await page.getByLabel("Organisationens namn").fill("OAuth Org");
await page.getByRole("button", { name: "Skapa organisation" }).click();
await page.waitForURL(/assistant\/oauth\/callback/, { timeout: 10000 }).catch(() => {});
console.log("2 after org:", page.url().replace("http://localhost:3000","").slice(0,120));
// sign out and run flow from anonymous
await page.context().clearCookies(); log.length = 0;
await page.goto(authorize); await page.waitForTimeout(1500);
console.log("3 anonymous:", log.join(" -> "));
await page.getByLabel("E-post").fill(email); await page.getByRole("textbox", { name: "Lösenord" }).fill("oauth-password-123");
await page.getByRole("button", { name: "Logga in" }).click();
await page.waitForURL(/assistant\/oauth\/callback/, { timeout: 10000 }).catch(() => {});
console.log("4 after login:", page.url().replace("http://localhost:3000","").slice(0,120));
await browser.close();
