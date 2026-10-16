"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { OptionStatusBadge } from "@/features/option/ui/option-status-badge";
import { itemRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { occupancyPeriod } from "./occupancy-period";

export type OptionQueueViewProps = GenerativeProps<"option-queue">;

/** Options in queue order: rank (or final status), held period and expiry; links to the item. */
export function OptionQueueView({ items, nextCursor }: OptionQueueViewProps) {
  const t = useTranslations("assistant.ui.option");
  const format = useFormatter();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="option-queue" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.rank")}</TableHead>
            <TableHead>{t("columns.period")}</TableHead>
            <TableHead>{t("columns.expiresAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((option) => (
            <TableRow key={option.id}>
              <TableCell>
                <OptionStatusBadge status={option.optionStatus} rank={option.rank} />
              </TableCell>
              <TableCell className="font-medium">
                <Link href={itemRoute({ id: option.itemId })} className="hover:underline">
                  {occupancyPeriod({ format, ...option })}
                </Link>
              </TableCell>
              <TableCell>
                {format.dateTime(new Date(option.expiresAt), {
                  dateStyle: "medium",
                  timeStyle: "short",
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
