import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { PlainDateStringSchema } from "../../time/plain-date-schema";
import { MAX_FINANCE_MONTHS } from "./schema";

export const ACCOUNTING_SOURCE_KINDS = [
  "INVOICE_SENT",
  "INVOICE_VOID",
  "PAYMENT",
  "FEE",
  "REFUND",
  "CREDIT_NOTE",
] as const;

/** One SIE file handed to the accounting program (ADR 0077); its bytes come with download. */
export const AccountingExportSchema = z.object({
  id: z.string(),
  number: z.number().int().describe("Per organization, 1, 2, 3 …"),
  fileName: z.string(),
  voucherCount: z.number().int(),
  periodStart: z.date().nullable().describe("Start of the reported range; null before ranges"),
  periodEnd: z.date().nullable().describe("End of the reported range, exclusive"),
  createdAt: z.date(),
  createdBy: z.string().nullable(),
});

export const ExportBlockerSchema = z.object({
  code: z.enum(["ORG_NUMBER_MISSING", "VAT_ACCOUNT_MISSING", "NOTHING_TO_EXPORT"]),
  detail: z.string().nullable().describe("E.g. the VAT rates without an account"),
});

/** What an export of the range would contain, and what stops it (ADR 0077). */
export const AccountingExportPreviewSchema = z.object({
  voucherCount: z.number().int(),
  counts: z.array(z.object({ kind: z.enum(ACCOUNTING_SOURCE_KINDS), count: z.number().int() })),
  firstDate: z.string().nullable().describe("Earliest voucher date, YYYY-MM-DD"),
  lastDate: z.string().nullable().describe("Latest voucher date, YYYY-MM-DD"),
  earlierExports: z
    .number()
    .int()
    .describe("Exports made before whose range overlaps this one; importing both duplicates"),
  blockers: z.array(ExportBlockerSchema).describe("Empty when the export can be created"),
});

/** The range an export reports: every voucher dated in it, however often it was exported. */
export const AccountingExportRangeInputSchema = z.object({
  from: PlainDateStringSchema.describe("First day to report, YYYY-MM-DD (inclusive)"),
  to: PlainDateStringSchema.describe(
    `Last day to report, YYYY-MM-DD (inclusive); at most ${MAX_FINANCE_MONTHS} months`,
  ),
});
export const AccountingExportPreviewInputSchema = AccountingExportRangeInputSchema;
export const AccountingExportCreateInputSchema = AccountingExportRangeInputSchema;
export const AccountingExportIdInputSchema = z.object({
  id: z.string().min(1).describe("accountingExport.list"),
});
export const AccountingExportListInputSchema = z.object({ ...PageInputShape });

export const AccountingExportListOutputSchema = z.object({
  items: z.array(AccountingExportSchema),
  nextCursor: z.string().nullable(),
});

/** The file itself, base64 because SIE is codepage 437 bytes (ADR 0077 decision 8). */
export const AccountingExportFileSchema = z.object({
  filename: z.string(),
  mime: z.string(),
  size: z.number().int(),
  contentBase64: z.string(),
});

export type AccountingExportRangeInput = z.infer<typeof AccountingExportRangeInputSchema>;
export type AccountingExportDto = z.infer<typeof AccountingExportSchema>;
export type AccountingExportPreviewDto = z.infer<typeof AccountingExportPreviewSchema>;
export type AccountingExportFileDto = z.infer<typeof AccountingExportFileSchema>;
export type ExportBlocker = z.infer<typeof ExportBlockerSchema>;
