import { describe, expect, it } from "vitest";
import { findProvider, type InvoiceSnapshot } from "../src/index";
import { creditRows } from "../src/providers/visma/visma-invoices";
import { derivedPayments } from "../src/providers/visma/visma-invoicing";
import { errorCode, unwrap } from "./helpers";
import { apiPath, stubVisma, tokenJson, useVismaEnv, vismaCompany } from "./visma-helpers";

useVismaEnv();

const visma = () => {
  const adapter = findProvider({ key: "VISMA" });
  if (!adapter?.invoicing || adapter.connect.kind !== "OAUTH") throw new Error("no Visma");
  return { adapter, oauth: adapter.connect, invoicing: adapter.invoicing };
};

const auth = { externalAccountId: null, accessToken: "visma-access-1" };

const snapshot = (): InvoiceSnapshot => ({
  invoiceDate: "2026-11-09",
  dueDate: "2026-12-09",
  currency: "SEK",
  reference: "Order #1042, invoice #7",
  buyerReference: "KS-2026-114",
  customer: {
    name: "Acme AB",
    email: "ap@acme.test",
    organizationNumber: "556677-8899",
    buyerKind: "BUSINESS",
  },
  lines: [
    {
      name: "Conference room",
      quantity: 2,
      unitPriceMinor: 500_000,
      discountPercent: 10,
      vatRatePercent: 25,
      vatRows: [{ vatRatePercent: 25, totalExclVatMinor: 900_000 }],
      revenueAccount: "3001",
    },
    {
      name: "Lunch package",
      quantity: 1,
      unitPriceMinor: 30_000,
      discountPercent: 0,
      vatRatePercent: 12,
      vatRows: [
        { vatRatePercent: 12, totalExclVatMinor: 20_000 },
        { vatRatePercent: 25, totalExclVatMinor: 10_000 },
      ],
      revenueAccount: "3002",
    },
  ],
  deductions: [
    {
      description: "Advance",
      amountMinor: 112_000,
      vatRows: [{ vatRatePercent: 12, totalExclVatMinor: 100_000, vatMinor: 12_000 }],
    },
  ],
  advancesAccount: "2420",
});

describe("Visma OAuth (ADR 0100)", () => {
  it("builds the consent URL with PKCE, scopes and the callback", () => {
    const url = new URL(visma().oauth.authorizeUrl({ state: "s1", codeChallenge: "c1" }));
    expect(url.origin + url.pathname).toBe("https://identity.visma.test/connect/authorize");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      client_id: "bibi-client",
      redirect_uri: "https://bibi.test/api/providers/visma/callback",
      scope: "ea:api ea:sales offline_access",
      state: "s1",
      code_challenge: "c1",
      code_challenge_method: "S256",
      response_type: "code",
    });
  });

  it("exchanges a code with Basic client credentials", async () => {
    const stub = stubVisma();
    stub.route = () => ({ json: tokenJson({ n: 1 }) });
    const tokens = unwrap({
      result: await visma().oauth.exchangeCode({
        code: "code-1",
        codeVerifier: "verifier",
        redirectUri: "https://bibi.test/api/providers/visma/callback",
      }),
    });
    expect(tokens).toEqual({
      accessToken: "visma-access-1",
      refreshToken: "visma-refresh-1",
      scope: "ea:api ea:sales offline_access",
      expiresIn: 3600,
    });
    const [call] = stub.calls;
    expect(call?.url).toBe("https://identity.visma.test/connect/token");
    expect(call?.headers.Authorization).toBe(
      `Basic ${Buffer.from("bibi-client:bibi-secret").toString("base64")}`,
    );
    expect(Object.fromEntries(new URLSearchParams(call?.body))).toMatchObject({
      grant_type: "authorization_code",
      code: "code-1",
      code_verifier: "verifier",
    });
  });

  it("tells a refused refresh token from an outage", async () => {
    const stub = stubVisma();
    stub.route = () => ({ status: 400, json: { error: "invalid_grant" } });
    const refused = unwrap({ result: await visma().oauth.refresh({ refreshToken: "old" }) });
    expect(refused).toEqual({ kind: "refused" });
    stub.route = () => ({ status: 503, json: {} });
    const down = await visma().oauth.refresh({ refreshToken: "old" });
    expect(errorCode({ result: down })).toBe("UNAVAILABLE");
    stub.route = () => ({ json: tokenJson({ n: 2 }) });
    const fresh = unwrap({ result: await visma().oauth.refresh({ refreshToken: "old" }) });
    expect(fresh.kind).toBe("tokens");
  });

  it("reads the company from the company settings", async () => {
    const stub = stubVisma();
    vismaCompany({ stub });
    const company = unwrap({ result: await visma().oauth.describeCompany({ accessToken: "a" }) });
    expect(company).toEqual({
      name: "Venue AB",
      organizationNumber: "556677-8899",
      tenantId: null,
    });
    expect(stub.calls[0]?.headers.Authorization).toBe("Bearer a");
  });
});

describe("Visma invoicing (ADR 0100)", () => {
  it("raises a booked invoice with rows per VAT rate and the deposit deducted", async () => {
    const stub = stubVisma();
    vismaCompany({ stub });
    const issued = unwrap({
      result: await visma().invoicing.issue({ auth, invoice: snapshot(), idempotencyKey: "inv1" }),
    });
    const posted = stub.calls.filter((c) => c.method === "POST").map((c) => apiPath({ call: c }));
    expect(posted).toEqual([
      "/customers",
      "/articles",
      "/articles",
      "/articles",
      "/customerinvoices",
    ]);
    expect(issued).toEqual({ providerReference: "id-5", url: null });
    // Revenue articles skip the advances codings; the deposit's article is coded to 2420 (ADR 0106).
    const articles = stub.calls
      .filter((c) => apiPath({ call: c }) === "/articles" && c.method === "POST")
      .map((c) => JSON.parse(c.body ?? "{}"));
    expect(articles).toMatchObject([
      { Number: "BIBI-VAT25", CodingId: "coding-25-3001" },
      { Number: "BIBI-VAT12", CodingId: "coding-12-3001" },
      { Number: "BIBI-ADV12", CodingId: "coding-12-2420" },
    ]);
    const customer = JSON.parse(
      stub.calls.find((c) => apiPath({ call: c }) === "/customers")?.body ?? "{}",
    );
    expect(customer).toMatchObject({
      Name: "Acme AB",
      EmailAddress: "ap@acme.test",
      TermsOfPaymentId: "t30",
    });
    const body = JSON.parse(stub.calls.at(-1)?.body ?? "{}");
    expect(body).toMatchObject({
      CustomerId: "id-1",
      InvoiceDate: "2026-11-09",
      DueDate: "2026-12-09",
      CurrencyCode: "SEK",
      OurReference: "Order #1042, invoice #7",
      YourReference: "KS-2026-114",
      IsCreditInvoice: false,
    });
    // 25 % → id-2, 12 % → id-3, the deposit at 12 % → advances article id-4; quantity −1.
    expect(body.Rows).toEqual([
      {
        LineNumber: 1,
        ArticleId: "id-2",
        Text: "Conference room",
        UnitPrice: 5000,
        Quantity: 2,
        DiscountPercentage: 0.1,
      },
      {
        LineNumber: 2,
        ArticleId: "id-3",
        Text: "Lunch package (12 %)",
        UnitPrice: 200,
        Quantity: 1,
        DiscountPercentage: 0,
      },
      {
        LineNumber: 3,
        ArticleId: "id-2",
        Text: "Lunch package (25 %)",
        UnitPrice: 100,
        Quantity: 1,
        DiscountPercentage: 0,
      },
      {
        LineNumber: 4,
        ArticleId: "id-4",
        Text: "Advance",
        UnitPrice: 1000,
        Quantity: -1,
        DiscountPercentage: 0,
      },
    ]);
  });

  it("raises a prepayment invoice on the advances article", async () => {
    const stub = stubVisma();
    vismaCompany({ stub });
    const line = {
      name: "Deposit",
      quantity: 1,
      unitPriceMinor: 100_000,
      discountPercent: 0,
      vatRatePercent: 25,
      vatRows: [{ vatRatePercent: 25, totalExclVatMinor: 100_000 }],
      revenueAccount: "2420",
    };
    const invoice: InvoiceSnapshot = { ...snapshot(), deductions: [], lines: [line] };
    unwrap({ result: await visma().invoicing.issue({ auth, invoice, idempotencyKey: "dep1" }) });
    const article = stub.calls.find(
      (c) => apiPath({ call: c }) === "/articles" && c.method === "POST",
    );
    expect(JSON.parse(article?.body ?? "{}")).toMatchObject({
      Number: "BIBI-ADV25",
      CodingId: "coding-25-2420",
    });
  });

  it("asks for an advances coding when Visma has none at the rate", async () => {
    const stub = stubVisma();
    vismaCompany({ stub, advances: false });
    const issued = await visma().invoicing.issue({
      auth,
      invoice: snapshot(),
      idempotencyKey: "i",
    });
    expect(errorCode({ result: issued })).toBe("CONFLICT");
    expect(issued.ok ? "" : issued.error.message).toContain("books sales to 2420");
  });

  it("refuses to void a booked invoice", async () => {
    const voided = await visma().invoicing.void({ auth, providerReference: "inv" });
    expect(errorCode({ result: voided })).toBe("CONFLICT");
  });

  it("credits in proportion and derives payments from what is left to pay", () => {
    const invoice = {
      Id: "inv",
      CustomerId: "c",
      TotalAmount: 1250,
      RemainingAmount: 1250,
      Rows: [
        { ArticleId: "a25", Text: "Room", UnitPrice: 1000, Quantity: 1, DiscountPercentage: 0 },
      ],
    };
    expect(creditRows({ invoice, amountMinor: 62_500 })).toEqual([
      { ArticleId: "a25", Text: "Room", UnitPrice: -500, Quantity: 1, DiscountPercentage: 0 },
    ]);
    const now = new Date("2026-11-09T12:00:00Z");
    expect(
      derivedPayments({
        id: "inv",
        totalAmount: 1250,
        remainingAmount: 1250,
        creditedMinor: 0,
        registeredMinor: 0,
        now,
      }),
    ).toEqual([]);
    expect(
      derivedPayments({
        id: "inv",
        totalAmount: 1250,
        remainingAmount: 250,
        creditedMinor: 0,
        registeredMinor: 0,
        now,
      }),
    ).toEqual([{ reference: "inv:paid:100000", amountMinor: 100_000, paidAt: now }]);
  });

  it("subtracts what Bibi registered itself from the derived payments", () => {
    const now = new Date("2026-11-09T12:00:00Z");
    const base = { id: "inv", totalAmount: 1250, remainingAmount: 0, creditedMinor: 0, now };
    expect(derivedPayments({ ...base, registeredMinor: 125_000 })).toEqual([]);
    expect(derivedPayments({ ...base, registeredMinor: 25_000 })).toEqual([
      { reference: "inv:paid:100000", amountMinor: 100_000, paidAt: now },
    ]);
  });

  it("registers a card payment on the invoice", async () => {
    const stub = stubVisma();
    stub.route = () => ({ status: 201, json: { Id: "pay-1" } });
    const paidAt = new Date("2026-11-09T12:00:00Z");
    const register = visma().invoicing.registerPayment;
    if (!register) throw new Error("no registerPayment");
    const done = await register({
      auth,
      providerReference: "inv",
      payment: { reference: "p1", amountMinor: 50_000, paidAt },
    });
    expect(unwrap({ result: done })).toEqual({ providerReference: "pay-1" });
    const [call] = stub.calls;
    expect(call?.method).toBe("POST");
    expect(apiPath({ call: call as NonNullable<typeof call> })).toBe(
      "/customerinvoices/inv/payments",
    );
    expect(JSON.parse(call?.body ?? "{}")).toEqual({
      PaymentDate: "2026-11-09",
      PaymentAmount: 500,
      PaymentCurrencyAmount: 500,
    });
  });
  it("finds a lost credit by its invoice and amount, never one already recorded", async () => {
    const stub = stubVisma();
    stub.route = () => ({
      json: {
        Data: [
          { Id: "credit-old", TotalAmount: -1120 },
          { Id: "credit-lost", TotalAmount: -1120 },
          { Id: "credit-other", TotalAmount: -500 },
        ],
      },
    });
    const lookup = visma().invoicing.creditStatus;
    if (!lookup) throw new Error("no creditStatus");
    const found = await lookup({
      auth,
      providerReference: "inv",
      amountMinor: 112_000,
      known: ["credit-old"],
    });
    expect(unwrap({ result: found })).toEqual({
      status: "ISSUED",
      providerReference: "credit-lost",
    });
    expect(apiPath({ call: stub.calls[0] as NonNullable<(typeof stub.calls)[0]> })).toBe(
      "/customerinvoices?$filter=CreditedInvoiceId eq inv",
    );
    const none = await lookup({ auth, providerReference: "inv", amountMinor: 1, known: [] });
    expect(unwrap({ result: none })).toEqual({ status: "MISSING" });
  });
});
