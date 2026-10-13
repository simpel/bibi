"use client";

import { Link, usePathname } from "@okazi/i18n/navigation";
import { cn } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { NAV_ITEMS } from "./nav-items";

export function SidebarNav() {
  const t = useTranslations("nav");
  const label = useTranslations("shell");
  const pathname = usePathname();
  return (
    <nav aria-label={label("mainNavigation")} className="grid gap-1">
      {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              active && "bg-accent text-accent-foreground",
            )}
          >
            <Icon className="size-4" />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
