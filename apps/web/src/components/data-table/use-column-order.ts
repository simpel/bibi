"use client";

import { useTranslations } from "next-intl";
import { saveUserPreference } from "@/features/user-preference/actions";
import { actionWithToast } from "@/lib/action-with-toast";
import { tableColumnsKey } from "@/lib/table-preferences";
import { useTablePreferences } from "./table-preferences-provider";

export type UseColumnOrderInput = { tableId: string };

/**
 * The user's saved column order for one table and the handler that saves a new one. Saving is
 * auto-save in the usual toast flow; on error the order goes back to the saved one.
 */
export function useColumnOrder({ tableId }: UseColumnOrderInput) {
  const common = useTranslations("common");
  const t = useTranslations("common.table");
  const errors = useTranslations("errors");
  const { orders, setOrder } = useTablePreferences();
  const saved = orders[tableId];
  const save = async ({ order }: { order: string[] }) => {
    setOrder({ tableId, order });
    const result = await actionWithToast({
      action: () => saveUserPreference({ key: tableColumnsKey({ tableId }), value: order }),
      messages: { pending: common("saving"), success: t("orderSaved") },
      translate: ({ key }) => errors(key),
    });
    if (!result.ok) setOrder({ tableId, order: saved });
  };
  return { order: saved, save };
}
