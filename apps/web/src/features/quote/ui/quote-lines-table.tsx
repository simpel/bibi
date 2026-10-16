import type { LineChange, OrderLineDto, QuoteLineDto } from "@okazi/core/schemas";
import {
  Badge,
  type BadgeProps,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@okazi/ui";
import { useLocale, useTranslations } from "next-intl";
import { formatKr } from "../../item/ui/format-price";

const CHANGE_VARIANT: Record<LineChange, BadgeProps["variant"]> = {
  ADDED: "success",
  CHANGED: "warning",
  UNCHANGED: "outline",
};

export type QuoteLinesTableProps = {
  lines: readonly QuoteLineDto[];
  removedLines: readonly OrderLineDto[];
};

type LineCellsProps = { line: OrderLineDto; removed?: boolean };

function LineCells({ line, removed = false }: LineCellsProps) {
  const t = useTranslations("quote");
  const locale = useLocale();
  const kr = ({ minor }: { minor: number }) => t("amount", { amount: formatKr({ minor, locale }) });
  const struck = removed ? "text-muted-foreground line-through" : undefined;
  return (
    <>
      <TableCell className={struck}>
        <span className="font-medium">{line.name}</span>
        {line.tags.length > 0 ? (
          <span className="block text-xs text-muted-foreground">
            {line.tags.map((tag) => tag.name).join(", ")}
          </span>
        ) : null}
      </TableCell>
      <TableCell className={struck}>{line.quantity}</TableCell>
      <TableCell className={struck}>{kr({ minor: line.unitPriceMinor })}</TableCell>
      <TableCell className={struck}>
        {line.discountPercent ? `${line.discountPercent} %` : "–"}
      </TableCell>
      <TableCell className={struck}>{`${line.vatRatePercent} %`}</TableCell>
      <TableCell className={struck}>{kr({ minor: line.totalExclVatMinor })}</TableCell>
    </>
  );
}

/** The quote's order lines with change markers, and the lines this version removed. */
export function QuoteLinesTable({ lines, removedLines }: QuoteLinesTableProps) {
  const t = useTranslations("quote");
  if (lines.length === 0 && removedLines.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("lines.none")}</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {(["item", "quantity", "unitPrice", "discount", "vat", "total", "change"] as const).map(
            (key) => (
              <TableHead key={key}>{t(`lines.${key}`)}</TableHead>
            ),
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => (
          <TableRow key={line.id}>
            <LineCells line={line} />
            <TableCell>
              {line.change ? (
                <Badge variant={CHANGE_VARIANT[line.change]}>{t(`changes.${line.change}`)}</Badge>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
        {removedLines.map((line) => (
          <TableRow key={line.id}>
            <LineCells line={line} removed />
            <TableCell>
              <Badge variant="destructive">{t("changes.REMOVED")}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
