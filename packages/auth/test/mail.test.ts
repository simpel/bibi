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

  it("mails a one-time code", async () => {
    const user = await signUp();
    await getAuth().api.sendVerificationOTP({ body: { email: user.email, type: "sign-in" } });
    const mail = lastMailTo({ email: user.email });
    const code = mail?.text.match(/\d{6}/)?.[0];
    expect(code).toBeDefined();
    expect(mail?.subject).not.toContain(code ?? "");
  });
});
