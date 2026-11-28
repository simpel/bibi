"use client";

import { Button, ContextMenuItem, cn } from "@bibi/ui";
import {
  ArmchairIcon,
  CircleCheckIcon,
  Undo2Icon,
  UserCheckIcon,
  UserXIcon,
  XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { NEXT_ACTIONS, type ReservationRow, type StaffAction } from "../lib/reservation-row";
import { useReservationState } from "./use-reservation-state";

const ICONS = {
  seat: ArmchairIcon,
  unseat: Undo2Icon,
  complete: CircleCheckIcon,
  markNoShow: UserXIcon,
  revertNoShow: UserCheckIcon,
  cancel: XIcon,
} as const;

export type ReservationActionsInput = {
  row: ReservationRow;
  canWrite: boolean;
  /** Cancel asks first: the owner of the table (or page) holds the dialog. */
  onCancel: (row: ReservationRow) => void;
};

/** What one row may do, its handlers and the cancel dialog, shared by the buttons and the menu. */
export function useReservationActions({ row, canWrite, onCancel }: ReservationActionsInput) {
  const t = useTranslations("reservation.actions");
  const { change, pending } = useReservationState();
  const run = ({ action }: { action: StaffAction }) =>
    action === "cancel" ? onCancel(row) : change({ id: row.id, action });
  const actions = canWrite
    ? NEXT_ACTIONS[row.state].map((action) => ({
        action,
        label: t(action),
        icon: ICONS[action],
        destructive: action === "cancel",
        disabled: pending,
      }))
    : [];
  return { actions, run };
}

export type ReservationRowActionsProps = ReservationActionsInput;

/** The last column: the next steps of a reservation's life as buttons, folding into a menu. */
export function ReservationRowActions(props: ReservationRowActionsProps) {
  const { actions, run } = useReservationActions(props);
  if (actions.length === 0) return null;
  return (
    <span className="flex items-center justify-end gap-2">
      {actions.map(({ action, label, icon: Icon, destructive, disabled }) => (
        <Button
          key={action}
          variant="outline"
          className={cn("size-12 shrink-0", destructive && "text-destructive")}
          aria-label={label}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            run({ action });
          }}
        >
          <Icon className="size-5" />
        </Button>
      ))}
    </span>
  );
}

/** The right-click menu: the same steps as the row's buttons. */
export function ReservationRowMenu(props: ReservationRowActionsProps) {
  const { actions, run } = useReservationActions(props);
  if (actions.length === 0) return null;
  return (
    <>
      {actions.map(({ action, label, icon: Icon, destructive }) => (
        <ContextMenuItem key={action} destructive={destructive} onSelect={() => run({ action })}>
          <Icon />
          {label}
        </ContextMenuItem>
      ))}
    </>
  );
}
