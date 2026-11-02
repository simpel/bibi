import { PersonName, type PersonOption } from "./person-name";

export type PersonNamesProps = { ids: readonly string[]; options: readonly PersonOption[] };

/** People by id, comma-separated, each opening their contact card; "–" when there are none. */
export function PersonNames({ ids, options }: PersonNamesProps) {
  if (ids.length === 0) return "–";
  return ids.map((id, index) => (
    <span key={id}>
      {index > 0 ? ", " : null}
      <PersonName options={options} id={id} />
    </span>
  ));
}
