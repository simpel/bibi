import { getTranslations } from "next-intl/server";
import type { LegendState } from "../calendar-legend";
import { type CalendarParams, calendarQuery } from "../calendar-params";
import { ALL_TYPES, type TypeOption } from "../calendar-types";
import { QueryFilter } from "./query-filter";

export type CalendarFiltersProps = {
  params: CalendarParams;
  venues: { id: string; name: string }[];
  types: TypeOption[];
  /** The type shown after defaulting (`undefined` = all types). */
  typeId: string | undefined;
  states: LegendState[];
  phases: { id: string; name: string }[];
  tickets: { id: string; reference: number }[];
};

type Option = { value: string; label: string };
type Key = keyof Pick<CalendarParams, "venueId" | "typeId" | "stateId" | "phaseId" | "ticketId">;

type FilterProps = {
  params: CalendarParams;
  /** The `CalendarParams` key this filter owns; `name` is its query key. */
  paramKey: Key;
  name: string;
  label: string;
  allLabel: string;
  options: Option[];
  value?: string | undefined;
  allValue?: string;
};

/** A dropdown shown only when there is something to choose; it keeps the other filters. */
function Filter({ params, paramKey, options, value, ...rest }: FilterProps) {
  if (options.length === 0) return null;
  const query = calendarQuery({ params: { ...params, [paramKey]: undefined } });
  return (
    <QueryFilter {...rest} value={value ?? params[paramKey]} options={options} query={query} />
  );
}

const named = ({ id, name }: { id: string; name: string }): Option => ({ value: id, label: name });

/** Venue, type, state, phase and ticket filters as URL state (ADR 0044, 0036). */
export async function CalendarFilters({ params, ...data }: CalendarFiltersProps) {
  const t = await getTranslations("calendar");
  const many = <Row extends { id: string; name: string }>({ rows }: { rows: Row[] }) =>
    rows.length > 1 ? rows.map(named) : [];
  return (
    <>
      <Filter
        {...{ params, paramKey: "typeId", name: "type", label: t("type") }}
        allLabel={t("allTypes")}
        allValue={ALL_TYPES}
        value={data.typeId}
        options={many({ rows: data.types })}
      />
      <Filter
        {...{ params, paramKey: "venueId", name: "venue", label: t("venue") }}
        allLabel={t("allVenues")}
        options={many({ rows: data.venues })}
      />
      <Filter
        {...{ params, paramKey: "stateId", name: "state", label: t("state") }}
        allLabel={t("allStates")}
        options={data.states.map(named)}
      />
      <Filter
        {...{ params, paramKey: "phaseId", name: "phase", label: t("phase") }}
        allLabel={t("allPhases")}
        options={data.phases.map(named)}
      />
      <Filter
        {...{ params, paramKey: "ticketId", name: "ticket", label: t("ticket") }}
        allLabel={t("allTickets")}
        options={data.tickets.map(({ id, reference }) => ({ value: id, label: `#${reference}` }))}
      />
    </>
  );
}
