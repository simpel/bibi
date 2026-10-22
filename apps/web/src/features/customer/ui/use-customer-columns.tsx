import type { CustomerDto, EntityTypeDto } from "@bibi/core";
import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Link } from "@/lib/navigation";
import { customerRoute } from "@/lib/routes";

export type CustomerRow = Pick<
  CustomerDto,
  "id" | "name" | "entityTypeId" | "invoiceCity" | "email"
>;

export type UseCustomerColumnsInput = {
  /** Omit to leave out the type column (assistant card). */
  types?: EntityTypeDto[];
};

/** Columns of the customer table, shared by the list page and the assistant card. */
export function useCustomerColumns({ types }: UseCustomerColumnsInput): ColumnDef<CustomerRow>[] {
  const t = useTranslations("customer.columns");
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
    ];
  }, [t, types]);
}
