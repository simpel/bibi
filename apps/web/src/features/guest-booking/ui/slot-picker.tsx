"use client";

import { Button, Calendar, calendarLocales, cn } from "@bibi/ui";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { dateOfDay, dayOfDate } from "@/lib/time/period-dates";
import { useQueryNavigation } from "@/lib/use-query-navigation";
import type { SlotChoice, SlotGroup } from "../lib/group-slots";

export type SlotPickerProps = {
  party: number;
  /** The largest party any sitting takes online; larger ones are asked to call. */
  maxParty: number;
  contactPhone: string | null;
  /** The chosen day and the first bookable one, `YYYY-MM-DD` in the room's zone. */
  day: string;
  today: string;
  /** The day's free times per sitting, prepared on the server for `party` and `day`. */
  groups: readonly SlotGroup[];
  /** The time currently chosen (the reservation's own time on the manage page). */
  selected?: string | undefined;
  onPick: (input: { slot: SlotChoice }) => void;
};

const CHIP = "h-11 min-w-11 px-3 tabular-nums";

/**
 * Party, day and time on one screen (ADR 0119): party and day live in the URL (`?party=&date=`),
 * so the server answers each change with the day's free times; a time is handed to `onPick`.
 */
export function SlotPicker(props: SlotPickerProps) {
  const t = useTranslations("guestBooking");
  const { navigate, pending } = useQueryNavigation();
  return (
    <div className="flex flex-col gap-6">
      <PartyChips
        {...props}
        onChange={({ party }) => navigate({ patch: { party: String(party) } })}
      />
      <section aria-labelledby="date-heading" className="flex flex-col gap-2">
        <h2 id="date-heading" className="text-sm font-medium">
          {t("date.label")}
        </h2>
        <DayCalendar
          day={props.day}
          today={props.today}
          onChange={({ day }) => navigate({ patch: { date: day } })}
        />
      </section>
      <section aria-labelledby="time-heading" aria-busy={pending} className="flex flex-col gap-3">
        <h2 id="time-heading" className="text-sm font-medium">
          {t("times.label")}
        </h2>
        {pending ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t("times.loading")}
          </p>
        ) : (
          <TimeGroups {...props} />
        )}
      </section>
    </div>
  );
}

type PartyChipsProps = Pick<SlotPickerProps, "party" | "maxParty" | "contactPhone"> & {
  onChange: (input: { party: number }) => void;
};

/** 1…max as chips, then "More" for a party that has to call. */
function PartyChips({ party, maxParty, contactPhone, onChange }: PartyChipsProps) {
  const t = useTranslations("guestBooking.party");
  const [more, setMore] = useState(false);
  const sizes = Array.from({ length: Math.max(1, maxParty) }, (_, index) => index + 1);
  return (
    <section aria-labelledby="party-heading" className="flex flex-col gap-2">
      <h2 id="party-heading" className="text-sm font-medium">
        {t("label")}
      </h2>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <Button
            key={size}
            type="button"
            variant={size === party && !more ? "default" : "outline"}
            aria-pressed={size === party && !more}
            aria-label={t("option", { count: size })}
            className={CHIP}
            onClick={() => {
              setMore(false);
              if (size !== party) onChange({ party: size });
            }}
          >
            {size}
          </Button>
        ))}
        <Button
          type="button"
          variant={more ? "default" : "outline"}
          aria-pressed={more}
          aria-expanded={more}
          aria-controls="large-party"
          className={CHIP}
          onClick={() => setMore((open) => !open)}
        >
          {t("more")}
        </Button>
      </div>
      {more ? (
        <p id="large-party" className="rounded-lg bg-muted px-3 py-2.5 text-sm">
          {contactPhone
            ? t("large", { count: maxParty + 1 })
            : t("largeNoPhone", { count: maxParty + 1 })}{" "}
          {contactPhone ? (
            <a
              href={`tel:${contactPhone.replace(/\s+/g, "")}`}
              className="font-medium whitespace-nowrap underline underline-offset-4"
            >
              {contactPhone}
            </a>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}

type DayCalendarProps = {
  day: string;
  today: string;
  onChange: (input: { day: string }) => void;
};

/** One month at a time, past days disabled, in the visitor's language. */
function DayCalendar({ day, today, onChange }: DayCalendarProps) {
  const locale = useLocale();
  const first = dateOfDay({ day: today });
  return (
    <Calendar
      mode="single"
      required
      selected={dateOfDay({ day })}
      defaultMonth={dateOfDay({ day })}
      startMonth={first}
      disabled={first ? { before: first } : undefined}
      onSelect={(date) => {
        if (date && dayOfDate({ date }) !== day) onChange({ day: dayOfDate({ date }) });
      }}
      locale={locale === "en" ? calendarLocales.en : calendarLocales.sv}
      weekStartsOn={1}
      className="w-fit self-center rounded-xl border [--cell-size:--spacing(10)]"
    />
  );
}

type TimeGroupsProps = Pick<SlotPickerProps, "groups" | "party" | "selected" | "onPick">;

/** The day's free times per sitting; an empty day says so and points to other days. */
function TimeGroups({ groups, party, selected, onPick }: TimeGroupsProps) {
  const t = useTranslations("guestBooking.times");
  if (groups.length === 0) {
    return (
      <p className="rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
        {t("empty", { count: party })}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.name} className="flex flex-col gap-2">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {group.name}
          </h3>
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {group.slots.map((slot) => (
              <li key={slot.startsAt}>
                <Button
                  type="button"
                  variant={slot.startsAt === selected ? "default" : "outline"}
                  aria-pressed={slot.startsAt === selected}
                  className={cn(CHIP, "w-full")}
                  onClick={() => onPick({ slot })}
                >
                  {slot.time}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
