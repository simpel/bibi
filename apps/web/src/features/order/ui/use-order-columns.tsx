import type { OrderDto } from "@bibi/core";
import type { DateTimeFormat, OrderStatusDto } from "@bibi/core/schemas";
import {
  Avatar,
  actionsColumn,
  type ColumnDef,
  ContactName,
  createTableColumns,
  statusColumn as uiStatusColumn,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import { namedOptionColumn } from "@/components/data-table/named-option-column";
import { type NamedOption, nameOf } from "@/components/form/named-option";
import type { PersonOption } from "@/components/people/person-name";
import { Link } from "@/lib/navigation";
import { orderName } from "@/lib/order-label";
import { customerRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { desiredPeriod } from "./desired-period";
import { OrderTitleCell } from "./order-title-cell";

type Column = ColumnDef<OrderDto>;
type Translate = ReturnType<typeof useTranslations<"order">>;
type Format = DateTimeFormat;

export type OrderLookups = {
  customers: NamedOption[];
  /** The caller may not view customers: the column shows "Hidden". */
  customersHidden?: boolean;
  types: NamedOption[];
  statuses: OrderStatusDto[];
  /** Members who can be assigned (`id` = user id). */
  members: PersonOption[];
  renderActions?: ((order: OrderDto) => ReactNode) | undefined;
};

const titleColumn = ({ t }: { t: Translate }): Column => ({
  id: "title",
  header: t("columns.title"),
  accessorFn: (order) => order.title ?? `#${order.reference}`,
  cell: ({ row: { original: order } }) => (
    <OrderTitleCell
      order={order}
      title={orderName({
        title: order.title,
        fallback: t("reference", { reference: order.reference }),
      })}
    />
  ),
});

type AssigneeInput = { t: Translate; members: PersonOption[] };

const assigneeColumn = ({ t, members }: AssigneeInput): Column => ({
  id: "assignee",
  header: t("columns.assignee"),
  enableSorting: false,
  accessorFn: (order) => members.find(({ id }) => id === order.assigneeId)?.name ?? "",
  cell: ({ row }) => {
    const member = members.find(({ id }) => id === row.original.assigneeId);
    if (!member) return "–";
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: only keeps the row click from firing; the controls inside handle the keyboard
      // biome-ignore lint/a11y/useKeyWithClickEvents: same wrapper, no action of its own
      <span className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
        <Avatar size="sm" name={member.name} photoUrl={null} />
        <ContactName contact={member} />
      </span>
    );
  },
});

const whenColumn = ({ t, format }: { t: Translate; format: Format }): Column => ({
  id: "when",
  header: t("columns.when"),
  accessorFn: (order) => order.desiredStartsAt,
  cell: ({ row: { original: order } }) => desiredPeriod({ order, format }),
});

const quantityColumn = ({ t }: { t: Translate }): Column => ({
  id: "quantity",
  header: t("columns.quantity"),
  accessorFn: (order) => order.guaranteedHeadcount ?? order.estimatedHeadcount,
  cell: ({ getValue }) => (getValue() as number | null) ?? "–",
});

type NamedInput = Pick<OrderLookups, "customers" | "types"> & {
  t: Translate;
  hidden: string | undefined;
};
const namedColumns = ({ t, customers, types, hidden }: NamedInput): Column[] => [
  {
    id: "customer",
    header: t("columns.customer"),
    accessorFn: (order: OrderDto) => nameOf({ options: customers, id: order.customerId, hidden }),
    cell: ({ row: { original: order } }) => {
      const label = nameOf({ options: customers, id: order.customerId, hidden });
      if (!order.customerId || hidden) return label;
      const href = customerRoute({ id: order.customerId });
      return (
        <Link href={href} onClick={(e) => e.stopPropagation()} className="hover:underline">
          {label}
        </Link>
      );
    },
  },
  namedOptionColumn({
    id: "type",
    header: t("columns.type"),
    options: types,
    pick: (order: OrderDto) => order.entityTypeId,
  }),
];

export function useOrderColumns({
  statuses,
  customers,
  customersHidden,
  types,
  members,
  renderActions,
}: OrderLookups): Column[] {
  const t = useTranslations("order");
  const common = useTranslations("common");
  const shown = customersHidden ? common("hidden") : undefined;
  const format = useDateTimeFormat();
  return useMemo<Column[]>(
    () =>
      createTableColumns<OrderDto>({
        primary: [titleColumn({ t })],
        relations: [
          ...namedColumns({ t, customers, types, hidden: shown }),
          assigneeColumn({ t, members }),
        ],
        status: [
          uiStatusColumn<OrderDto>({
            header: t("columns.status"),
            getStatus: (order) => {
              const status = statuses.find(({ id }) => id === order.statusId);
              return status ? { label: status.name, color: status.color } : null;
            },
          }),
        ],
        dates: [whenColumn({ t, format })],
        numbers: [quantityColumn({ t })],
        actions: renderActions
          ? [actionsColumn<OrderDto>({ label: common("actions"), cell: renderActions })]
          : [],
      }),
    [t, common, format, customers, types, members, statuses, shown, renderActions],
  );
}
