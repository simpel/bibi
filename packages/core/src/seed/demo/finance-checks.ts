import { previewAccountingExport } from "../../features/finance/export-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoFinanceInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0077: every `money.invoice` ticket has one SENT invoice (paid in full when asked), the
 * mapped item types have their revenue accounts, and the first SIE export left nothing pending.
 * Returns failure messages.
 */
export async function checkDemoFinance({ context, org }: CheckDemoFinanceInput) {
  const failures: string[] = [];
  const wanted = org.tickets.filter((ticket) => ticket.money?.invoice);
  const invoices = await context.db.invoice.findMany({
    where: { status: "SENT" },
    select: { totalInclVatMinor: true, payments: { where: { status: "SUCCEEDED" } } },
  });
  if (invoices.length !== wanted.length) {
    failures.push(`${org.slug}: ${invoices.length} sent invoices, expected ${wanted.length}`);
  }
  const paid = invoices.filter((row) =>
    row.payments.some((p) => p.amountMinor === row.totalInclVatMinor),
  );
  const wantedPaid = wanted.filter((ticket) => ticket.money?.invoice?.paid).length;
  if (paid.length !== wantedPaid)
    failures.push(`${org.slug}: ${paid.length} invoices paid, expected ${wantedPaid}`);
  if (!org.finance) return failures;
  const mapped = await context.db.revenueAccount.count();
  if (mapped !== org.finance.revenueAccounts.length) {
    failures.push(
      `${org.slug}: ${mapped} revenue accounts, expected ${org.finance.revenueAccounts.length}`,
    );
  }
  const exports = await context.db.accountingExport.count();
  const preview = await execute({ operation: previewAccountingExport, input: {}, context });
  const pending = preview.ok ? preview.value.voucherCount : -1;
  if (exports !== 1 || pending !== 0) {
    failures.push(
      `${org.slug}: ${exports} SIE exports with ${pending} vouchers pending, expected 1 and 0`,
    );
  }
  return failures;
}
