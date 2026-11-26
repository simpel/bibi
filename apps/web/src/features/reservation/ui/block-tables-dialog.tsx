"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { DateField } from "@/components/date-picker/date-field";
import { TextField } from "@/components/form/text-field";
import { TimeField } from "@/components/form/time-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { zodMessageMap } from "@/lib/zod-error-map";
import { createBlockAction } from "../actions";
import {
  type BlockFormOutput,
  type BlockFormValues,
  blockDefaults,
  blockFormSchema,
} from "../lib/block-form";
import type { TableChoice } from "../lib/table-choice";
import { TableChips } from "./table-chips";

export type BlockTablesButtonProps = {
  roomItemId: string;
  date: string;
  /** Every seated table of the layouts the room's sittings use. */
  tables: readonly TableChoice[];
};

function BlockForm({
  roomItemId,
  date,
  tables,
  onDone,
}: BlockTablesButtonProps & { onDone: () => void }) {
  const t = useTranslations("reservation.block");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const form = useForm<BlockFormValues, unknown, BlockFormOutput>({
    resolver: zodResolver(blockFormSchema, {
      error: zodMessageMap({ translate: (key) => errors(key) }),
    }),
    defaultValues: blockDefaults({ day: date }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createBlockAction({ input: { ...values, roomItemId } }),
    messages: { pending: common("saving"), success: t("created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <FormController
          control={form.control}
          name="elementIds"
          render={({ field }) => (
            <FormItem>
              <TableChips
                label={t("tables")}
                tables={tables}
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormController
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("kind")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BLOCK">{t("kinds.BLOCK")}</SelectItem>
                  <SelectItem value="ONLINE_ONLY">{t("kinds.ONLINE_ONLY")}</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DateField form={form} name="startDay" label={t("startDay")} required />
          <TimeField form={form} name="startTime" label={t("startTime")} required />
          <DateField form={form} name="endDay" label={t("endDay")} required />
          <TimeField form={form} name="endTime" label={t("endTime")} required />
        </div>
        <TextField form={form} name="note" label={t("note")} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {t("submit")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/** Block tables: hold tables back from guests (or from everyone) for a period. */
export function BlockTablesButton(props: BlockTablesButtonProps) {
  const t = useTranslations("reservation.block");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <LockIcon />
        {t("title")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          {open ? <BlockForm {...props} onDone={() => setOpen(false)} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
