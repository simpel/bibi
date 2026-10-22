"use client";

import { Link, usePathname } from "@bibi/i18n/navigation";
import { ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { buildCrumbs } from "./breadcrumb-model";
import { useCrumbNames } from "./crumb-names";

/** Where the user is, from the path (detail pages name their crumb with `CrumbName`); the start page (the assistant) shows "Assistant". */
export function Breadcrumb() {
  const t = useTranslations("nav");
  const { names } = useCrumbNames();
  const crumbs = buildCrumbs({ pathname: usePathname() });
  if (crumbs.length === 0) {
    return <span className="truncate text-sm font-medium">{t("assistant")}</span>;
  }
  return (
    <nav aria-label={t("breadcrumb")} className="min-w-0">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          const label = names[crumb.href] ?? t(crumb.labelKey);
          return (
            <li key={crumb.href} className="flex min-w-0 items-center gap-1">
              {index > 0 ? <ChevronRightIcon className="size-3.5 shrink-0" aria-hidden /> : null}
              {last ? (
                <span aria-current="page" className="truncate font-medium text-foreground">
                  {label}
                </span>
              ) : (
                <Link href={crumb.href} className="truncate hover:text-foreground">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
