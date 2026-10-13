"use client";

import { Button, Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@okazi/ui";
import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Sidebar } from "./sidebar";

export type MobileNavProps = { organizationId: string };

/** Sidebar in a sheet below the `md` breakpoint. */
export function MobileNav({ organizationId }: MobileNavProps) {
  const t = useTranslations("nav");
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={t("openMenu")}>
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">{t("openMenu")}</SheetTitle>
        <SheetDescription className="sr-only">{t("openMenu")}</SheetDescription>
        <Sidebar organizationId={organizationId} />
      </SheetContent>
    </Sheet>
  );
}
