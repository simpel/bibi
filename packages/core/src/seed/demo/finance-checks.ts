import { previewAccountingExport } from "../../features/finance/export-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { demoExportRange } from "./finance-range";
import type { DemoOrg } from "./types";

export type CheckDemoFinanceInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0077: every `money.invoice` order has one SENT invoice (paid in full when asked), the
 * mapped item types have their revenue accounts, and the first SIE export holds every voucher of its range (it can be exported again).
 * Returns failure messages.
 */
export async function checkDemoFinance({ context, org }: CheckDemoFinanceInput) {
  const failures: string[] = [];
  const wanted = org.orders.filter((order) => order.money?.invoice);
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
  const wantedPaid = wanted.filter((order) => order.money?.invoice?.paid).length;
  if (paid.length !== wantedPaid)
    failures.push(`${org.slug}: ${paid.length} invoices paid, expected ${wantedPaid}`);
  if (!org.finance) return failures;
  const mapped = await context.db.revenueAccount.count();
  if (mapped !== org.finance.revenueAccounts.length) {
    failures.push(
      `${org.slug}: ${mapped} revenue accounts, expected ${org.finance.revenueAccounts.length}`,
    );
  }
  const made = await context.db.accountingExport.findMany({ select: { voucherCount: true } });
  const input = demoExportRange();
  const preview = await execute({ operation: previewAccountingExport, input, context });
  const inRange = preview.ok ? preview.value.voucherCount : -1;
  if (made.length !== 1 || made[0]?.voucherCount !== inRange || inRange < 1) {
    failures.push(
      `${org.slug}: ${made.length} SIE exports of ${made[0]?.voucherCount} vouchers, ` +
        `expected 1 holding the ${inRange} vouchers of ${input.from}–${input.to}`,
    );
  }
  return failures;
}
