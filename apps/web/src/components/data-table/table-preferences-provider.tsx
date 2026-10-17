"use client";

import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { parseTableOrders } from "@/lib/table-preferences";

export type SetOrderInput = { tableId: string; order: string[] | undefined };

type TablePreferencesValue = {
  orders: Record<string, string[]>;
  setOrder: (input: SetOrderInput) => void;
};

const TablePreferencesContext = createContext<TablePreferencesValue | null>(null);

export type TablePreferencesProviderProps = {
  /** The user's `table.columns.*` preferences, loaded once by the layout. */
  preferences: Record<string, unknown>;
  children: ReactNode;
};

/** Holds the signed-in user's saved column orders so every table renders in her order at once. */
export function TablePreferencesProvider({ preferences, children }: TablePreferencesProviderProps) {
  const [orders, setOrders] = useState(() => parseTableOrders({ preferences }));
  const value = useMemo<TablePreferencesValue>(
    () => ({
      orders,
      setOrder: ({ tableId, order }) =>
        setOrders(({ [tableId]: _previous, ...rest }) =>
          order ? { ...rest, [tableId]: order } : rest,
        ),
    }),
    [orders],
  );
  return (
    <TablePreferencesContext.Provider value={value}>{children}</TablePreferencesContext.Provider>
  );
}

export function useTablePreferences(): TablePreferencesValue {
  const value = useContext(TablePreferencesContext);
  if (!value) throw new Error("useTablePreferences needs a TablePreferencesProvider");
  return value;
}
