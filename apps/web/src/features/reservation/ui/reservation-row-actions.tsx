"use client";

import { ContextMenuItem, DataTableRowActions } from "@bibi/ui";
import { ArmchairIcon, CircleCheckIcon, Undo2Icon, UserXIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { NEXT_ACTIONS, type ReservationRow, type StaffAction } from "../lib/reservation-row";
import { useReservationState } from "./use-reservation-state";

const ICONS = {
  seat: ArmchairIcon,
  unseat: Undo2Icon,
  complete: CircleCheckIcon,
  markNoShow: UserXIcon,
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
  const common = useTranslations("common");
  const { actions, run } = useReservationActions(props);
  if (actions.length === 0) return null;
  return (
    <DataTableRowActions
      label={common("actions")}
      primary={actions.map(({ action, label, icon, destructive, disabled }) => ({
        label,
        icon,
        destructive,
        disabled,
        onClick: () => run({ action }),
      }))}
    />
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
