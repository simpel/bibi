"use client";

import type { ItemTypeGroupDto } from "@bibi/core";
import { ItemTypeGroupCreateInputSchema } from "@bibi/core/schemas";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createItemTypeGroupAction, updateItemTypeGroupAction } from "../actions";

export type ItemTypeGroupFormProps = { group?: ItemTypeGroupDto | undefined; onDone: () => void };

type Values = { name: string };

/** Create (no `group`) or rename form: just the name. */
export function ItemTypeGroupForm({ group, onDone }: ItemTypeGroupFormProps) {
  const t = useTranslations("itemTypeGroup");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<Values, unknown, Values>({
    resolver: zodResolver(ItemTypeGroupCreateInputSchema, useZodMessages()),
    defaultValues: { name: group?.name ?? "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      group
        ? updateItemTypeGroupAction({ id: group.id, name: values.name })
        : createItemTypeGroupAction({ name: values.name }),
    messages: { pending: t("saving"), success: t(group ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
