"use client";

import { useEffect } from "react";
import { useCrumbNames } from "./crumb-names";

export type CrumbNameProps = {
  /** The crumb's path without locale, e.g. `memberRoute({ id })`. */
  href: string;
  name: string;
};

/** Rendered by a detail page: shows the record's name in the breadcrumb instead of "Details". */
export function CrumbName({ href, name }: CrumbNameProps) {
  const { setName } = useCrumbNames();
  useEffect(() => {
    setName({ href, name });
    return () => setName({ href, name: null });
  }, [href, name, setName]);
  return null;
}
