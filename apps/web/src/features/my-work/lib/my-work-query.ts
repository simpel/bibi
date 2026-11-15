import { filterTableRows, type TableQualifier } from "@/components/data-table/table-filter-query";
import type { MyWorkCardWireish } from "../ui/my-work-wireish";

export type MyWorkQueryLabels = { status: string; customer: string; place: string };

type MyWorkQualifiersInput = {
  /** The cards whose values the qualifiers suggest. */
  cards: readonly MyWorkCardWireish[];
  labels: MyWorkQueryLabels;
};

const distinct = ({ values }: { values: readonly (string | null | undefined)[] }) => [
  ...new Set(values.filter((value): value is string => Boolean(value))),
];

/** My work's search qualifiers (`status:`, `customer:`, `place:`), shared by page and Later. */
export function myWorkQualifiers({
  cards,
  labels,
}: MyWorkQualifiersInput): TableQualifier<MyWorkCardWireish>[] {
  return [
    {
      key: "status",
      label: labels.status,
      options: distinct({ values: cards.map((card) => card.status?.name) }),
      pick: (card) => card.status?.name,
    },
    {
      key: "customer",
      label: labels.customer,
      options: distinct({ values: cards.map((card) => card.customerName) }),
      pick: (card) => card.customerName,
    },
    {
      key: "place",
      label: labels.place,
      options: distinct({ values: cards.flatMap((card) => card.places ?? []) }),
      pick: (card) => card.places ?? [],
    },
  ];
}

export type FilterMyWorkInput = {
  cards: readonly MyWorkCardWireish[];
  q: string | undefined;
  labels: MyWorkQueryLabels;
};

/** The free text a card matches: title, customer, number, status and places. */
const searchText = ({ card }: { card: MyWorkCardWireish }): string =>
  [card.title, card.customerName, `#${card.reference}`, card.status?.name, ...(card.places ?? [])]
    .filter(Boolean)
    .join(" ");

/** The cards that match the search (`?q=`), the same on the page and in Later. */
export function filterMyWork({ cards, q, labels }: FilterMyWorkInput): MyWorkCardWireish[] {
  return filterTableRows({
    rows: cards,
    q,
    qualifiers: myWorkQualifiers({ cards, labels }),
    getSearchText: (card) => searchText({ card }),
  });
}
