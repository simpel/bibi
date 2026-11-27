"use client";

import { DiningRoomSetInputSchema } from "@bibi/core/schemas";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
} from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { zodMessageMap } from "@/lib/zod-error-map";
import { setDiningRoomAction } from "../actions";

type Values = { slug: string };

export type EnableTableBookingButtonProps = {
  itemId: string;
  /** The address word suggested from the room's name (`slugOf`). */
  suggestedSlug: string;
};

/** Turns table booking on for the room it sits on: a small dialog for the address word. */
export function EnableTableBookingButton({ itemId, suggestedSlug }: EnableTableBookingButtonProps) {
  const t = useTranslations("tableBooking.itemSection");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const schema = formSchema({
    schema: DiningRoomSetInputSchema.pick({ slug: true }),
    toInput: ({ values }: { values: Values }) => ({ slug: values.slug.trim().toLowerCase() }),
  });
  const form = useForm<Values, unknown, { slug: string }>({
    resolver: zodResolver(schema, { error: zodMessageMap({ translate: (key) => errors(key) }) }),
    defaultValues: { slug: suggestedSlug },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => setDiningRoomAction({ itemId, slug: values.slug }),
    messages: { pending: common("saving"), success: t("enabled") },
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t("enable")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("enable")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={submit} noValidate className="grid gap-4">
            <TextField form={form} name="slug" label={t("slug")} autoComplete="off" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {common("cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {common("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
