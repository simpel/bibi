"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { AdminSectionId } from "@/components/shell/admin-sections";
import { Link } from "@/lib/navigation";

export type SettingsCardProps = {
  slot: string;
  title: string;
  /** The administration page the settings live on. */
  href: string;
  children: ReactNode;
};

/**
 * An administration page's settings in the chat, edited in place: each change saves through the
 * page's own server action with the same toast, and the card keeps the saved value.
 */
export function SettingsCard({ slot, title, href, children }: SettingsCardProps) {
  const t = useTranslations("assistant.ui.settings");
  return (
    <Card data-slot={slot} className="shadow-none">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 p-4 text-sm [&>section:first-child]:border-t-0 [&>section:first-child]:pt-0">
        {children}
        <Link href={href} className="w-fit text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}

export type SettingRowProps = {
  /** Named like its section on the administration page and in the sidebar. */
  section: AdminSectionId;
  description?: string | undefined;
  /** A control on the title row, like a switch. */
  action?: ReactNode;
  children?: ReactNode;
};

/** One setting: its title (and an inline control), a description, then its editor. */
export function SettingRow({ section, description, action, children }: SettingRowProps) {
  const t = useTranslations("adminArea.search.entries");
  return (
    <section className="grid gap-3 border-t pt-4">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <h3 className="font-medium">{t(`${section}.label`)}</h3>
          {description ? <p className="text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
