import { buildVouchers } from "../../accounting/sie4/vouchers";
import { writeSie } from "../../accounting/sie4/write";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, invalid, notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import {
  AccountingExportCreateInputSchema,
  AccountingExportFileSchema,
  AccountingExportIdInputSchema,
  AccountingExportListInputSchema,
  AccountingExportListOutputSchema,
  AccountingExportPreviewInputSchema,
  AccountingExportPreviewSchema,
  AccountingExportSchema,
} from "./export-schema";
import { EXPORT_SELECT, insertExport } from "./insert-export";
import { exportBlockers, planExport, previewOf } from "./plan-export";
import { toSieFile } from "./sie-file";

const entityType = "accountingExport";

export const previewAccountingExport = defineOperation({
  name: "accountingExport.preview",
  entityType,
  kind: "query",
  description:
    "What the next SIE export would contain: vouchers per kind (invoices sent or voided, " +
    "payments, fees, refunds) not exported before, their date span, and what blocks it.",
  input: AccountingExportPreviewInputSchema,
  output: AccountingExportPreviewSchema,
  permission: "finance:read",
  handler: async ({ context }) => ok({ value: previewOf({ plan: await planExport({ context }) }) }),
});

export const createAccountingExport = defineOperation({
  name: "accountingExport.create",
  entityType,
  kind: "command",
  description:
    "Create the next SIE 4I export: one voucher per invoice sent or voided, payment, fee and " +
    "refund not exported before. Download it with accountingExport.download.",
  input: AccountingExportCreateInputSchema,
  output: AccountingExportSchema,
  permission: "finance:write",
  handler: async ({ context }) => {
    const plan = await planExport({ context });
    const blockers = exportBlockers({ plan });
    if (blockers.some((b) => b.code === "NOTHING_TO_EXPORT")) {
      return conflict({ message: "Nothing to export" });
    }
    const [blocker] = blockers;
    if (blocker) return invalid({ message: `${blocker.code} ${blocker.detail ?? ""}`.trim() });
    const events = plan.pending.map((pending) => pending.event);
    const vouchers = buildVouchers({ accounts: plan.accounts, events });
    if (!vouchers.ok) return vouchers;
    const bytes = writeSie({
      file: toSieFile({ plan, vouchers: vouchers.value, now: new Date() }),
    });
    if (!bytes.ok) return bytes;
    const row = await insertExport({ context, plan, bytes: bytes.value });
    context.recordChange({ entityId: row.id, after: row });
    return ok({ value: row });
  },
});

export const listAccountingExports = defineOperation({
  name: "accountingExport.list",
  entityType,
  kind: "query",
  description: "SIE exports made so far, newest first: number, file name and voucher count.",
  input: AccountingExportListInputSchema,
  output: AccountingExportListOutputSchema,
  permission: "finance:read",
  handler: async ({ input: { limit, cursor }, context }) => {
    const rows = await context.db.accountingExport.findMany({
      select: EXPORT_SELECT,
      orderBy: [{ number: "desc" }, { id: "desc" }],
      ...pageArgs({ limit, cursor }),
    });
    const page = paginate({ rows, limit });
    return ok({ value: { items: page.items, nextCursor: page.nextCursor } });
  },
});

export const getAccountingExport = defineOperation({
  name: "accountingExport.get",
  entityType,
  kind: "query",
  description: "One SIE export by id: number, file name, voucher count and who made it.",
  input: AccountingExportIdInputSchema,
  output: AccountingExportSchema,
  permission: "finance:read",
  handler: async ({ input, context }) => {
    const row = await context.db.accountingExport.findFirst({
      where: input,
      select: EXPORT_SELECT,
    });
    return row ? ok({ value: row }) : notFound({ entity: "AccountingExport" });
  },
});

export const downloadAccountingExport = defineOperation({
  name: "accountingExport.download",
  entityType,
  kind: "query",
  description:
    "The SIE file of an export, exactly as created (codepage 437, base64), to import into the " +
    "accounting program.",
  input: AccountingExportIdInputSchema,
  output: AccountingExportFileSchema,
  permission: "finance:write",
  handler: async ({ input, context }) => {
    const row = await context.db.accountingExport.findFirst({
      where: input,
      select: { fileName: true, fileBytes: true },
    });
    if (!row) return notFound({ entity: "AccountingExport" });
    const content = Buffer.from(row.fileBytes);
    const file = { filename: row.fileName, mime: "text/plain", size: content.byteLength };
    return ok({ value: { ...file, contentBase64: content.toString("base64") } });
  },
});

export const accountingExportOperations = [
  previewAccountingExport,
  createAccountingExport,
  listAccountingExports,
  getAccountingExport,
  downloadAccountingExport,
];
