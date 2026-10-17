"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { responsibilitiesRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type ResponsibilityTableViewProps = GenerativeProps<"responsibility-table">;

/** A page of responsibilities; names link to the responsibilities settings page. */
export function ResponsibilityTableView({ items, nextCursor }: ResponsibilityTableViewProps) {
  const t = useTranslations("assistant.ui.responsibility");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="responsibility-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.covers")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((responsibility) => (
            <TableRow key={responsibility.id}>
              <TableCell className="font-medium">
                <Link href={responsibilitiesRoute()} className="hover:underline">
                  {responsibility.name}
                </Link>
              </TableCell>
              <TableCell>
                {t("covers", {
                  types: responsibility.entityTypeIds.length,
                  followers: responsibility.defaultFollowerIds.length,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
