import {
  defineDeleteOperation,
  defineRestoreOperation,
} from "../../archive/define-lifecycle-operations";
import { priceListKind } from "./deletion-kind";
import { getPriceList } from "./operations";
import { PriceListIdInputSchema } from "./schema";

export const restorePriceList = defineRestoreOperation({
  name: "priceList.restore",
  description:
    "Restore an archived price list: it is active again. CONFLICT when it is not archived or " +
    "its customer is archived.",
  permission: "priceList:delete",
  kind: priceListKind,
  input: PriceListIdInputSchema,
  get: getPriceList,
});

export const deletePriceList = defineDeleteOperation({
  name: "priceList.delete",
  description:
    "Delete an archived price list permanently (ADR 0118), with its prices. An active price " +
    "list is CONFLICT: archive it first.",
  permission: "priceList:delete",
  kind: priceListKind,
  input: PriceListIdInputSchema,
});
