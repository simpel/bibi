import type { CustomerDto, EntityTypeDto } from "@bibi/core";
import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import { Link } from "@/lib/navigation";
import { customerRoute } from "@/lib/routes";

export type CustomerRow = Pick<
  CustomerDto,
  "id" | "name" | "entityTypeId" | "invoiceCity" | "email"
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
      ...(renderActions
        ? [actionsColumn<CustomerRow>({ label: common("actions"), cell: renderActions })]
        : []),
    ];
  }, [t, common, types, renderActions]);
}
