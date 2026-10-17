import { getTranslations } from "next-intl/server";
import { type CalendarParams, calendarQuery } from "../calendar-params";
import { ALL_TYPES, type TypeOption } from "../calendar-types";
import { QueryFilter } from "./query-filter";

export type CalendarFiltersProps = {
  params: CalendarParams;
  venues: { id: string; name: string }[];
  types: TypeOption[];
  /** The type shown after defaulting (`undefined` = all types). */
  typeId: string | undefined;
};

const options = ({ rows }: { rows: { id: string; name: string }[] }) =>
  rows.map(({ id, name }) => ({ value: id, label: name }));

/** Venue and type dropdowns, each shown only when there is something to choose between. */
export async function CalendarFilters({ params, venues, types, typeId }: CalendarFiltersProps) {
  const t = await getTranslations("calendar");
  const { venueId: _venue, ...withoutVenue } = params;
  const { typeId: _type, ...withoutType } = params;
  return (
    <>
      {types.length > 1 ? (
        <QueryFilter
          name="type"
          label={t("type")}
          allLabel={t("allTypes")}
          allValue={ALL_TYPES}
          value={typeId}
          options={options({ rows: types })}
          query={calendarQuery({ params: withoutType })}
        />
      ) : null}
      {venues.length > 1 ? (
        <QueryFilter
          name="venue"
          label={t("venue")}
          allLabel={t("allVenues")}
          value={params.venueId}
          options={options({ rows: venues })}
          query={calendarQuery({ params: withoutVenue })}
        />
      ) : null}
    </>
  );
}
