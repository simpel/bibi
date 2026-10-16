"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { bookingRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type RequirementTableViewProps = GenerativeProps<"requirement-table">;

/** A page of requirements; each row links to its booking's page. */
export function RequirementTableView({ items, nextCursor }: RequirementTableViewProps) {
  const t = useTranslations("assistant.ui.requirement");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="requirement-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.quantity")}</TableHead>
            <TableHead>{t("columns.where")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((requirement) => (
            <TableRow key={requirement.id}>
              <TableCell className="font-medium">
                <Link
                  href={bookingRoute({ id: requirement.bookingId })}
                  className="hover:underline"
                >
                  {requirement.quantity}
                </Link>
              </TableCell>
              <TableCell>
                {requirement.programItemId ? t("onProgramItem") : t("onBooking")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
