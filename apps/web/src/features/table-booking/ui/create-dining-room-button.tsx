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
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { zodMessageMap } from "@/lib/zod-error-map";
import { setDiningRoomAction } from "../actions";
import type { RoomCandidate } from "../lib/room-row";
import { tableBookingRoomRoute } from "../lib/routes";
import { slugOf } from "../lib/slug";

type Values = { itemId: string; slug: string };

const schema = formSchema({
  schema: DiningRoomSetInputSchema.pick({ itemId: true, slug: true }),
  toInput: ({ values }: { values: Values }) => ({
    itemId: values.itemId,
    slug: values.slug.trim().toLowerCase(),
  }),
});

export type CreateDiningRoomButtonProps = { candidates: readonly RoomCandidate[] };

/** A small dialog: pick a room and its address word; the room's settings page opens next. */
export function CreateDiningRoomButton({ candidates }: CreateDiningRoomButtonProps) {
  const t = useTranslations("tableBooking.rooms");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<Values, unknown, { itemId: string; slug: string }>({
    resolver: zodResolver(schema, { error: zodMessageMap({ translate: (key) => errors(key) }) }),
    defaultValues: { itemId: "", slug: "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => setDiningRoomAction(values),
    messages: { pending: common("saving"), success: t("created") },
    onSuccess: ({ value }) => {
      setOpen(false);
      router.push(tableBookingRoomRoute({ itemId: value.itemId }));
    },
  });
  const suggest = ({ itemId }: { itemId: string }) => {
    const name = candidates.find((candidate) => candidate.id === itemId)?.name ?? "";
    if (!form.getValues("slug")) form.setValue("slug", slugOf({ name }));
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          {t("create")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("create")}</DialogTitle>
          <DialogDescription>
            {candidates.length === 0 ? t("noCandidates") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={submit} noValidate className="grid gap-4">
            <OptionSelectField
              control={form.control}
              name="itemId"
              label={t("room")}
              options={candidates}
              onChange={(itemId) => suggest({ itemId })}
            />
            <TextField form={form} name="slug" label={t("slug")} autoComplete="off" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {common("cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {t("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
