"use client";

import type { PageContext } from "@bibi/ai";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { buildPageContext } from "../lib/page-context";

/** Route, locale and (on detail pages) entity of the page the user is looking at. */
export function usePageContext(): PageContext {
  const pathname = usePathname();
  const locale = useLocale() === "en" ? "en" : "sv";
  return useMemo(() => buildPageContext({ pathname, locale }), [pathname, locale]);
}
