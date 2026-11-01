import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";

export const ACCOUNTING_SOURCE_KINDS = [
  "INVOICE_SENT",
  "INVOICE_VOID",
  "PAYMENT",
  "FEE",
  "REFUND",
] as const;

/** One SIE file handed to the accounting program (ADR 0077); its bytes come with download. */
export const AccountingExportSchema = z.object({
  id: z.string(),
  number: z.number().int().describe("Per organization, 1, 2, 3 …"),
  fileName: z.string(),
  voucherCount: z.number().int(),
  createdAt: z.date(),
  createdBy: z.string().nullable(),
});

export const ExportBlockerSchema = z.object({
  code: z.enum(["ORG_NUMBER_MISSING", "VAT_ACCOUNT_MISSING", "NOTHING_TO_EXPORT"]),
  detail: z.string().nullable().describe("E.g. the VAT rates without an account"),
});

/** What the next export would contain, and what stops it (ADR 0077). */
export const AccountingExportPreviewSchema = z.object({
  voucherCount: z.number().int(),
  counts: z.array(z.object({ kind: z.enum(ACCOUNTING_SOURCE_KINDS), count: z.number().int() })),
  firstDate: z.string().nullable().describe("Earliest voucher date, YYYY-MM-DD"),
  lastDate: z.string().nullable().describe("Latest voucher date, YYYY-MM-DD"),
  blockers: z.array(ExportBlockerSchema).describe("Empty when the export can be created"),
});

export const AccountingExportPreviewInputSchema = z.object({});
export const AccountingExportCreateInputSchema = z.object({});
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

export type AccountingExportDto = z.infer<typeof AccountingExportSchema>;
export type AccountingExportPreviewDto = z.infer<typeof AccountingExportPreviewSchema>;
export type AccountingExportFileDto = z.infer<typeof AccountingExportFileSchema>;
export type ExportBlocker = z.infer<typeof ExportBlockerSchema>;
