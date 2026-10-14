"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { setupsRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type SetupTableViewProps = GenerativeProps<"setup-table">;

/** A page of setups; names link to the setups settings page. */
export function SetupTableView({ items, nextCursor }: SetupTableViewProps) {
  const t = useTranslations("assistant.ui.setup");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="setup-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.changeover")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((setup) => (
            <TableRow key={setup.id}>
              <TableCell className="font-medium">
                <Link href={setupsRoute()} className="hover:underline">
                  {setup.name}
                </Link>
              </TableCell>
              <TableCell>{t("changeover", { minutes: setup.changeoverMinutes })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
