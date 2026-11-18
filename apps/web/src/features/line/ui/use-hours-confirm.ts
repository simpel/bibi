"use client";

import type { LineDto, LineHoursCheck } from "@bibi/core";
import { useState } from "react";
import { checkLineHoursAction } from "../actions";
import type { LineFormOutput } from "./line-form-schema";

type OutsideKind = NonNullable<LineHoursCheck["kind"]>;

export type HoursConfirm = {
  /** The values waiting for the user's yes, and which hours they fall outside. */
  waiting: { values: LineFormOutput; kind: OutsideKind } | null;
  /** Checks the values; resolves true when they may be saved now, false when the dialog opened. */
  check: (input: { values: LineFormOutput }) => Promise<boolean>;
  /** Closes the dialog without saving. */
  cancel: () => void;
};

const sameTime = ({ a, b }: { a: Date | null | undefined; b: Date | null }) =>
  (a?.getTime() ?? null) === (b?.getTime() ?? null);

/** A new line, or an edit that moved the line to another item or time. */
const moved = ({ line, values }: { line: LineDto | undefined; values: LineFormOutput }) =>
  !line ||
  line.itemId !== values.itemId ||
  !sameTime({ a: values.startsAt, b: line.startsAt }) ||
  !sameTime({ a: values.endsAt, b: line.endsAt });

/**
 * The confirm before a line is saved outside the item's or venue's hours (ADR 0064: hours are
 * advisory, so the user may go ahead). Asked only when the item or time changed; when the check
 * itself fails the line saves as before.
 */
export function useHoursConfirm({ line }: { line: LineDto | undefined }): HoursConfirm {
  const [waiting, setWaiting] = useState<HoursConfirm["waiting"]>(null);
  const check = async ({ values }: { values: LineFormOutput }) => {
    const { itemId, startsAt, endsAt } = values;
    if (!itemId || !startsAt || !endsAt || !moved({ line, values })) return true;
    const result = await checkLineHoursAction({ input: { itemId, startsAt, endsAt } });
    if (!result.ok || result.value.kind === null) return true;
    setWaiting({ values, kind: result.value.kind });
    return false;
  };
  return { waiting, check, cancel: () => setWaiting(null) };
}
