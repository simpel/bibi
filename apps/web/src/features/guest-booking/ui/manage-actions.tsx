"use client";

import { PublicChangeInputSchema } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClockIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formSchema } from "@/lib/form-schema";
import { Link, useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { cancelGuestReservationAction, changeGuestReservationAction } from "../actions";
import { guestErrorKey } from "../lib/guest-error";
import { BookerFields, type BookerValues } from "./booker-fields";

export type ManageActionsProps = {
  token: string;
  booker: BookerValues;
  /** "Your table for 2 guests on Friday 4 December 19:30", prepared on the server. */
  cancelSummary: { party: string; when: string };
};

/** What a guest may do before the cutoff: a new time, their details, or cancel (ADR 0119). */
export function ManageActions({ token, booker, cancelSummary }: ManageActionsProps) {
  const t = useTranslations("guestBooking.manage");
  const [editing, setEditing] = useState(false);
  if (editing)
    return <DetailsForm token={token} booker={booker} onDone={() => setEditing(false)} />;
  return (
    <div className="flex flex-col gap-2">
      <Button asChild className="h-11 w-full">
        <Link href={`/book/manage/${token}?change=1`}>
          <CalendarClockIcon aria-hidden />
          {t("changeTime")}
        </Link>
      </Button>
      <Button variant="outline" className="h-11 w-full" onClick={() => setEditing(true)}>
        <PencilIcon aria-hidden />
        {t("editDetails")}
      </Button>
      <CancelBooking token={token} summary={cancelSummary} />
    </div>
  );
}

const Details = PublicChangeInputSchema.pick({
  bookerName: true,
  bookerPhone: true,
  bookerEmail: true,
  note: true,
}).required({ bookerName: true, bookerPhone: true, bookerEmail: true });

const DetailsSchema = formSchema<BookerValues, typeof Details>({
  schema: Details,
  toInput: ({ values }) => values,
});

type DetailsFormProps = { token: string; booker: BookerValues; onDone: () => void };

/** The booker's details as one form with Save; only changed details are sent. */
function DetailsForm({ token, booker, onDone }: DetailsFormProps) {
  const t = useTranslations("guestBooking");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const form = useForm<BookerValues, unknown, z.output<typeof DetailsSchema>>({
    resolver: zodResolver(DetailsSchema, useZodMessages()),
    defaultValues: booker,
  });
  const submit = form.handleSubmit(({ note, ...values }) =>
    run({
      action: () => changeGuestReservationAction({ token, ...values, note: note || null }),
      messages: { pending: t("manage.detailsPending"), success: t("manage.detailsSaved") },
      errorMessage: ({ error }) => {
        const key = guestErrorKey({ error });
        return key ? t(`errors.${key}`) : null;
      },
      onSuccess: () => {
        onDone();
        router.refresh();
      },
    }),
  );
  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <BookerFields
          form={form}
          labels={{
            ...{ name: t("details.name"), phone: t("details.phone"), email: t("details.email") },
            ...{ emailHint: t("details.emailHint"), note: t("details.note") },
          }}
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="h-11" onClick={onDone}>
            {t("manage.cancelEdit")}
          </Button>
          <Button type="submit" className="h-11" disabled={pending}>
            {t("manage.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

type CancelBookingProps = { token: string; summary: ManageActionsProps["cancelSummary"] };

/** Cancel, confirmed first: it releases the table and cannot be undone online. */
function CancelBooking({ token, summary }: CancelBookingProps) {
  const t = useTranslations("guestBooking");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { run, pending } = useToastAction();
  return (
    <>
      <Button
        variant="ghost"
        className="h-11 w-full text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        {t("manage.cancelBooking")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("manage.cancelTitle")}
        description={t("manage.cancelDescription", summary)}
        confirmLabel={t("manage.cancelConfirm")}
        pending={pending}
        onConfirm={() =>
          run({
            action: () => cancelGuestReservationAction({ token }),
            messages: { pending: t("manage.cancelPending"), success: t("manage.cancelDone") },
            errorMessage: ({ error }) => {
              const key = guestErrorKey({ error });
              return key ? t(`errors.${key}`) : null;
            },
            onSuccess: () => {
              setOpen(false);
              router.refresh();
            },
          })
        }
      />
    </>
  );
}
