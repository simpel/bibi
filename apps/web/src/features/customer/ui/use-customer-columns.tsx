import type { CustomerDto, EntityTypeDto } from "@bibi/core";
import { actionsColumn, type ColumnDef, numberColumn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import { Link } from "@/lib/navigation";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { customerRoute } from "@/lib/routes";

export type CustomerRow = Pick<
  CustomerDto,
  "id" | "name" | "entityTypeId" | "invoiceCity" | "email" | "valueMinor"
>;

export type UseCustomerColumnsInput = {
  /** Omit to leave out the type column (assistant card). */
  types?: EntityTypeDto[];
  renderActions?: ((row: CustomerRow) => ReactNode) | undefined;
};

/** Columns of the customer table, shared by the list page and the assistant card. */
export function useCustomerColumns({
  types,
  renderActions,
}: UseCustomerColumnsInput): ColumnDef<CustomerRow>[] {
  const t = useTranslations("customer.columns");
  const common = useTranslations("common");
  const { money } = useNumberFormat();
  return useMemo<ColumnDef<CustomerRow>[]>(() => {
    const typeName = ({ id }: { id: string }) => types?.find((type) => type.id === id)?.name ?? "–";
    const typeColumn: ColumnDef<CustomerRow>[] = types
      ? [{ id: "type", header: t("type"), accessorFn: (c) => typeName({ id: c.entityTypeId }) }]
      : [];
    return [
      {
        id: "name",
        header: t("name"),
        accessorFn: (c) => c.name,
        cell: ({ row }) => (
          <Link
            href={customerRoute({ id: row.original.id })}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      ...typeColumn,
      { id: "city", header: t("city"), accessorFn: (c) => c.invoiceCity ?? "–" },
      { id: "email", header: t("email"), accessorFn: (c) => c.email ?? "–" },
      numberColumn<CustomerRow>({
        id: "value",
        header: t("value"),
        align: "right",
        getValue: (c) => c.valueMinor ?? -1,
        cell: (c) => (c.valueMinor === null ? "–" : money({ minor: c.valueMinor })),
        help: (
          <div className="grid gap-1.5">
            <p className="font-medium">{t("valueHelp.title")}</p>
            <p className="text-muted-foreground">{t("valueHelp.total")}</p>
            <p className="text-muted-foreground">{t("valueHelp.order")}</p>
            <p className="text-muted-foreground">{t("valueHelp.lost")}</p>
          </div>
        ),
      }),
      ...(renderActions
        ? [actionsColumn<CustomerRow>({ label: common("actions"), cell: renderActions })]
        : []),
    ];
  }, [t, common, money, types, renderActions]);
}
