import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoProvidersInput = { context: ExecuteContext; org: DemoOrg };

/** ADR 0100: every provider the data files connect is CONNECTED, and nothing else but Stripe. */
async function connectionFailures({ context, org }: CheckDemoProvidersInput) {
  const rows = await context.db.providerConnection.findMany({
    select: { provider: true, status: true, externalAccountId: true },
  });
  const hasMoney = org.orders.some((order) => order.money);
  const wanted = new Set<string>([...(hasMoney ? ["STRIPE"] : []), ...(org.providers ?? [])]);
  const failures: string[] = [];
  for (const provider of wanted) {
    const row = rows.find((r) => r.provider === provider);
    if (row?.status !== "CONNECTED") {
      failures.push(`${org.slug}: ${provider} is ${row?.status ?? "not connected"}`);
    } else if (!row.externalAccountId && provider !== "FORTNOX" && provider !== "VISMA") {
      failures.push(`${org.slug}: ${provider} has no account id`);
    }
  }
  const extra = rows.filter((row) => !wanted.has(row.provider));
  if (extra.length > 0) failures.push(`${org.slug}: unexpected connections ${extra.length}`);
  return failures;
}

/** Swish and manual payments exist as seeded, each settled with the right method and provider. */
async function paymentFailures({ context, org }: CheckDemoProvidersInput) {
  const money = org.orders.flatMap((order) => (order.money ? [order.money] : []));
  const payments = await context.db.payment.findMany({
    where: { method: { in: ["SWISH", "MANUAL"] } },
    include: { attempts: true },
  });
  const failures: string[] = [];
  const swish = payments.filter((p) => p.method === "SWISH");
  const manual = payments.filter((p) => p.method === "MANUAL");
  if (swish.length !== money.filter((m) => m.swishKr).length) {
    failures.push(`${org.slug}: ${swish.length} Swish payments`);
  }
  if (manual.length !== money.filter((m) => m.manual).length) {
    failures.push(`${org.slug}: ${manual.length} manual payments`);
  }
  for (const payment of swish) {
    const paid = payment.attempts.some((a) => a.status === "SUCCEEDED" && a.provider === "SWISH");
    if (payment.status !== "SUCCEEDED" || payment.provider !== "SWISH" || !paid) {
      failures.push(`${org.slug}: Swish payment ${payment.id} is ${payment.status}`);
    }
  }
  for (const payment of manual) {
    if (payment.status !== "SUCCEEDED" || payment.provider !== null || !payment.note) {
      failures.push(`${org.slug}: manual payment ${payment.id} is ${payment.status}`);
    }
  }
  return failures;
}

/**
 * Credit notes and ledger invoices: each credit is ISSUED and lowers the invoice's amount due,
 * an invoice raised in a provider has its reference, and what a ledger provider booked is paid
 * through it (an INVOICE payment), never exported as ours.
 */
async function invoiceFailures({ context, org }: CheckDemoProvidersInput) {
  const wanted = org.orders.flatMap((o) => (o.money?.invoice ? [o.money.invoice] : []));
  const invoices = await context.db.invoice.findMany({
    where: { status: "SENT" },
    include: {
      creditNotes: true,
      payments: { where: { status: "SUCCEEDED" }, include: { attempts: true } },
    },
  });
  const failures: string[] = [];
  const credited = invoices.filter((i) => i.creditNotes.length > 0);
  if (credited.length !== wanted.filter((w) => w.credit).length) {
    failures.push(`${org.slug}: ${credited.length} credited invoices`);
  }
  for (const invoice of credited) {
    for (const note of invoice.creditNotes) {
      const atProvider = invoice.provider !== null;
      if (note.status !== "ISSUED" || note.issuedAt === null) {
        failures.push(`${org.slug}: credit note ${note.id} is ${note.status}`);
      }
      if (atProvider && !note.providerReference) {
        failures.push(`${org.slug}: credit note ${note.id} has no provider reference`);
      }
    }
  }
  // Every invoice is raised in the accounting system (ADR 0106); `provider` in the data files
  // only picks which one when the organization has two.
  const ledger = wanted.filter((w) => w.provider);
  const raised = invoices.filter((i) => i.provider === "FORTNOX" || i.provider === "VISMA");
  if (raised.length !== wanted.length) {
    failures.push(`${org.slug}: ${raised.length} ledger invoices, expected ${wanted.length}`);
  }
  for (const invoice of raised) {
    if (!invoice.providerReference)
      failures.push(`${org.slug}: invoice ${invoice.id} has no reference`);
    // A card payment counts only when the ledger provider booked it too (`registerPayment`).
    const wrong = invoice.payments.filter(
      (p) =>
        p.method !== "INVOICE" &&
        !p.attempts.some((a) => a.provider === invoice.provider && a.status === "SUCCEEDED"),
    );
    if (wrong.length > 0)
      failures.push(`${org.slug}: invoice ${invoice.id} paid outside its ledger`);
    const cards = invoice.payments.filter((p) => p.method === "CARD").length;
    const wantedCards = ledger.filter((w) => w.cardKr && w.provider === invoice.provider).length;
    if (ledger.length > 0 && cards !== wantedCards)
      failures.push(`${org.slug}: invoice ${invoice.id} has ${cards} registered card payments`);
  }
  return failures;
}

/** ADR 0100: no refund is left PENDING (the retry job settled the lost one) and each lost one SUCCEEDED. */
async function refundFailures({ context, org }: CheckDemoProvidersInput) {
  const lost = org.orders.filter((order) => order.money?.lostRefundKr).length;
  const pending = await context.db.paymentRefund.count({ where: { status: "PENDING" } });
  const settled = await context.db.paymentRefund.count({
    where: { status: "SUCCEEDED", reason: "One guest fewer" },
  });
  const failures: string[] = [];
  if (pending > 0) failures.push(`${org.slug}: ${pending} refunds still PENDING`);
  if (settled !== lost)
    failures.push(`${org.slug}: ${settled} lost refunds settled, ${lost} seeded`);
  return failures;
}

/**
 * ADR 0100: the providers' connections, the Swish and manual payments, the credit notes and the
 * ledger invoices read back as seeded. Returns failure messages.
 */
export async function checkDemoProviders({ context, org }: CheckDemoProvidersInput) {
  const input = { context, org };
  const parts = await Promise.all([
    connectionFailures(input),
    paymentFailures(input),
    invoiceFailures(input),
    refundFailures(input),
  ]);
  return parts.flat();
}
