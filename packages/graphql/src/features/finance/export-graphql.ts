import {
  type AccountingExportDto,
  type AccountingExportFileDto,
  AccountingExportFileSchema,
  type AccountingExportPreviewDto,
  AccountingExportPreviewSchema,
  AccountingExportSchema,
  createAccountingExport,
  downloadAccountingExport,
  getAccountingExport,
  listAccountingExports,
  previewAccountingExport,
} from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

const AccountingExportRef = objectFromSchema<AccountingExportDto>({
  name: "AccountingExport",
  schema: AccountingExportSchema,
  description: "One SIE 4I file handed to the accounting program (ADR 0077).",
});
const AccountingExportPageRef = pageType({
  name: "AccountingExportPage",
  item: AccountingExportRef,
});
const AccountingExportPreviewRef = objectFromSchema<AccountingExportPreviewDto>({
  name: "AccountingExportPreview",
  schema: AccountingExportPreviewSchema,
  description: "What the next SIE export would contain and what blocks it.",
});
const AccountingExportFileRef = objectFromSchema<AccountingExportFileDto>({
  name: "AccountingExportFile",
  schema: AccountingExportFileSchema,
  description: "An SIE export's file, codepage 437 bytes as base64.",
});

fieldFromOperation({
  operation: previewAccountingExport,
  type: AccountingExportPreviewRef,
  name: "accountingExportPreview",
});
fieldFromOperation({
  operation: listAccountingExports,
  type: AccountingExportPageRef,
  name: "accountingExports",
});
fieldFromOperation({
  operation: getAccountingExport,
  type: AccountingExportRef,
  name: "accountingExport",
});
fieldFromOperation({
  operation: downloadAccountingExport,
  type: AccountingExportFileRef,
  name: "accountingExportFile",
});
mutationFromOperation({ operation: createAccountingExport, type: AccountingExportRef });
