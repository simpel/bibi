"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

type CrumbNames = Readonly<Record<string, string>>;

type CrumbNamesState = {
  names: CrumbNames;
  setName: (input: { href: string; name: string | null }) => void;
};

const CrumbNamesContext = createContext<CrumbNamesState>({ names: {}, setName: () => {} });

/** Holds the record names that replace "Details" crumbs, keyed by the crumb's path. */
export function CrumbNamesProvider({ children }: { children: ReactNode }) {
  const [names, setNames] = useState<CrumbNames>({});
  // Stable, so a `CrumbName` effect does not re-run when another name changes.
  const setName = useCallback<CrumbNamesState["setName"]>(
    ({ href, name }) =>
      setNames((current) => {
        if ((current[href] ?? null) === name) return current;
        const { [href]: _dropped, ...rest } = current;
        return name === null ? rest : { ...rest, [href]: name };
      }),
    [],
  );
  const value = useMemo<CrumbNamesState>(() => ({ names, setName }), [names, setName]);
  return <CrumbNamesContext.Provider value={value}>{children}</CrumbNamesContext.Provider>;
}

export function useCrumbNames(): CrumbNamesState {
  return useContext(CrumbNamesContext);
}
