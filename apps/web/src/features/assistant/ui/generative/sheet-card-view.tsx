"use client";

import { Link } from "@bibi/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { SheetMatches } from "@/features/sheet/ui/sheet-matches";
import { SheetRowsView } from "@/features/sheet/ui/sheet-rows-view";
import { SheetStatus } from "@/features/sheet/ui/sheet-status";
import { ticketRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type SheetCardViewProps = GenerativeProps<"sheet-card">;

/** One sheet version: its status, the rows and the ★ changes since the last sent version. */
export function SheetCardView({ sheet }: SheetCardViewProps) {
  const t = useTranslations("assistant.ui.sheet");
  return (
    <Card data-slot="sheet-card" className="shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{t("singular")}</CardTitle>
        <SheetStatus sheet={sheet} />
      </CardHeader>
      <CardContent className="grid gap-2 p-4 pt-0">
        <SheetMatches matches={sheet.matches} />
        <SheetRowsView content={sheet.content} changes={sheet.changes} />
        <Link
          href={ticketRoute({ id: sheet.ticketId })}
          className="text-sm text-primary hover:underline"
        >
          {t("openTicket")}
        </Link>
      </CardContent>
    </Card>
  );
}
