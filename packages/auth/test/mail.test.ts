import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { afterAll, describe, expect, it } from "vitest";
import { getAuth, resolveExecuteContext } from "../src/index";
import { installFakeMail, uninstallFakeMail } from "./fake-mail";
import { codeOf, cookieHeaders, createOrg, signUp } from "./helpers";

const outbox = installFakeMail();
afterAll(() => uninstallFakeMail());

const lastMailTo = ({ email }: { email: string }) => outbox.filter((m) => m.to === email).at(-1);

describe("passwordless sign-in mails", () => {
  it("magic link mail signs the user in with their organization active", async () => {
    const user = await signUp();
    const organizationId = await createOrg({ headers: user.headers });
    await getAuth().api.signInMagicLink({ body: { email: user.email }, headers: new Headers() });
    const mail = lastMailTo({ email: user.email });
    const link = mail?.text.match(/https?:\/\/\S+/)?.[0];
    if (!link) throw new Error("no magic link mailed");
    const response = await getAuth().handler(new Request(link));
    const headers = cookieHeaders({ response: response.headers });
    const result = await resolveExecuteContext({ headers });
    expect(codeOf({ result })).toBe("OK");
    expect(result.ok && result.value.organizationId).toBe(organizationId);
  });
  it("signs up a new email through the link, with the name from the form (ADR 0005)", async () => {
    const email = `new-${createId()}@example.test`;
    await getAuth().api.signInMagicLink({
      body: { email, name: "Ny Användare" },
      headers: new Headers(),
    });
    const link = lastMailTo({ email })?.text.match(/https?:\/\/\S+/)?.[0];
    if (!link) throw new Error("no magic link mailed");
    await getAuth().handler(new Request(link));
    const user = await getDb().user.findUnique({ where: { email } });
    expect(user).toMatchObject({ name: "Ny Användare", emailVerified: true });
  });

  it("refuses email and password sign-up and sign-in", async () => {
    const body = JSON.stringify({
      email: `pw-${createId()}@example.test`,
      password: "x".repeat(12),
      name: "X",
    });
    for (const path of ["sign-up/email", "sign-in/email"]) {
      const response = await getAuth().handler(
        new Request(`${getAuth().options.baseURL}/api/auth/${path}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
        }),
      );
      expect(response.status).toBe(400);
    }
  });
});
