import type { ContactDto, EntityTypeDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { customerRoute } from "@/lib/routes";

export type ContactRow = Pick<
  ContactDto,
  "id" | "customerId" | "name" | "entityTypeId" | "email" | "phone"
>;

export type UseContactColumnsInput<TRow extends ContactRow> = {
  /** Omit to leave out the type column (assistant card). */
  types?: EntityTypeDto[];
  /** Link each name to the customer's page (assistant card). */
  linkNames?: boolean;
  /** Row actions menu; omit for no actions column. */
  renderActions?: (row: TRow) => ReactNode;
};

/** Columns of the contact table, shared by the customer page and the assistant card. */
export function useContactColumns<TRow extends ContactRow>({
  types,
  linkNames = false,
  renderActions,
}: UseContactColumnsInput<TRow>): ColumnDef<TRow>[] {
  const t = useTranslations("contact.columns");
  const common = useTranslations("common");
  const typeName = ({ id }: { id: string }) => types?.find((type) => type.id === id)?.name ?? "–";
  const typeColumn: ColumnDef<TRow>[] = types
    ? [{ id: "type", header: t("type"), accessorFn: (c) => typeName({ id: c.entityTypeId }) }]
    : [];
  const actionColumn: ColumnDef<TRow>[] = renderActions
    ? [actionsColumn<TRow>({ label: common("actions"), cell: renderActions })]
    : [];
  return [
    {
      id: "name",
      header: t("name"),
      accessorFn: (c) => c.name,
      cell: ({ row }) =>
        linkNames ? (
          <Link
            href={customerRoute({ id: row.original.customerId })}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ) : (
          <span className="font-medium">{row.original.name}</span>
        ),
    },
    ...typeColumn,
    { id: "email", header: t("email"), accessorFn: (c) => c.email ?? "–" },
    { id: "phone", header: t("phone"), accessorFn: (c) => c.phone ?? "–" },
    ...actionColumn,
  ];
}
