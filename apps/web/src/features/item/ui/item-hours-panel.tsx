"use client";

import { Button, Form, Label, Switch } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { rowsFromDays } from "@/features/hours/lib/hours";
import { exceptionRowsFrom } from "@/features/hours/lib/hours-exceptions";
import { HoursExceptionsSummary } from "@/features/hours/ui/hours-exceptions-summary";
import { HoursSectionButtons } from "@/features/hours/ui/hours-section-buttons";
import type { HoursPattern } from "@/features/hours/ui/hours-section-form";
import { HoursSummary } from "@/features/hours/ui/hours-summary";
import { HoursWeekEditor } from "@/features/hours/ui/hours-week-editor";
import { useHoursSectionForm } from "@/features/hours/ui/use-hours-section-form";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { saveItemHoursAction } from "../actions";

export type ItemHoursPanelProps = {
  itemId: string;
  /** The item's own hours; empty = it follows its venue. */
  own: HoursPattern;
  /** Its venue and the venue's opening hours (null: none set, or the caller may not see venues). */
  venue: { name: string; hours: HoursPattern | null } | null;
  canEdit: boolean;
};

const hasHours = ({ hours }: { hours: HoursPattern | null }) =>
  !!hours && (hours.days.length > 0 || hours.exceptions.length > 0);

/**
 * An item's working hours in one place: the week it keeps, always shown, and an Own hours
 * switch. Off, the week is its venue's and nothing is stored on the item; on, the item keeps its
 * own (starting from the venue's) and a pencil edits them. Hours are advisory (ADR 0064).
 */
export function ItemHoursPanel({ itemId, own, venue, canEdit }: ItemHoursPanelProps) {
  const t = useTranslations("item.hours");
  const switchId = useId();
  const router = useRouter();
  const hasOwn = hasHours({ hours: own });
  const venueHours = venue?.hours ?? null;
  const start = hasOwn ? own : { days: venueHours?.days ?? [], exceptions: [] };
  const { form, submit, pending, editing, setEditing } = useHoursSectionForm({
    initial: start,
    save: (input) => saveItemHoursAction({ input: { itemId, ...input } }),
  });
  const [confirming, setConfirming] = useState(false);
  const clear = useToastAction();
  const shown = hasOwn ? own : venueHours;
  const note = hasOwn
    ? t("ownNote")
    : venue && hasHours({ hours: venueHours })
      ? t("fromVenue", { venue: venue.name })
      : t("noHours");
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl">{t("title")}</h2>
          <div className="flex items-center gap-3">
            {canEdit ? (
              <span className="flex items-center gap-2">
                <Switch
                  id={switchId}
                  checked={hasOwn || editing}
                  disabled={pending || clear.pending}
                  onCheckedChange={(on) =>
                    on ? setEditing(true) : hasOwn ? setConfirming(true) : setEditing(false)
                  }
                />
                <Label htmlFor={switchId}>{t("ownHours")}</Label>
              </span>
            ) : null}
            {canEdit && hasOwn && !editing ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("edit")}
                onClick={() => setEditing(true)}
                className="text-muted-foreground"
              >
                <PencilIcon />
              </Button>
            ) : null}
          </div>
        </div>
        {editing ? (
          <>
            <HoursWeekEditor form={form} withExceptions />
            <HoursSectionButtons
              editing
              pending={pending}
              onEdit={() => setEditing(true)}
              onCancel={() => {
                form.reset();
                setEditing(false);
              }}
            />
          </>
        ) : shown && hasHours({ hours: shown }) ? (
          <div className="grid gap-3">
            <HoursSummary rows={rowsFromDays({ days: shown.days })} />
            {shown.exceptions.length ? (
              <HoursExceptionsSummary rows={exceptionRowsFrom({ exceptions: shown.exceptions })} />
            ) : null}
          </div>
        ) : null}
        {editing ? null : <p className="text-sm text-muted-foreground">{note}</p>}
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={t("followVenueTitle")}
          description={
            venue
              ? t("followVenueDescription", { venue: venue.name })
              : t("followNothingDescription")
          }
          confirmLabel={t("followVenue")}
          pending={clear.pending}
          variant="default"
          onConfirm={() =>
            clear.run({
              action: () => saveItemHoursAction({ input: { itemId, days: [], exceptions: [] } }),
              messages: { pending: t("saving"), success: t("followsVenueSaved") },
              onSuccess: () => {
                setConfirming(false);
                router.refresh();
              },
            })
          }
        />
      </form>
    </Form>
  );
}
