"use client";

import type { LayoutCreateInput } from "@bibi/core/schemas";
import { LayoutCreateInputSchema } from "@bibi/core/schemas";
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
import type { NamedOption } from "@/components/form/named-option";
import { NONE, OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createLayoutAction } from "../actions";
import { layoutsRoute } from "../layouts-path";

type Values = { itemId: string; name: string; description: string; copyFromId: string };

const createSchema = formSchema({
  schema: LayoutCreateInputSchema,
  toInput: ({ values }: { values: Values }) => ({
    itemId: values.itemId,
    name: values.name.trim(),
    description: values.description.trim() || null,
    copyFromId: values.copyFromId === NONE ? undefined : values.copyFromId,
  }),
});

export type CreateLayoutButtonProps = {
  itemId: string;
  /** The item's layouts, to start from a copy. */
  layouts: readonly NamedOption[];
  /** The toolbar's small "+" instead of the empty state's full button. */
  compact?: boolean;
};

/** A small dialog: the new layout's name, what it suits and, optionally, a layout to copy. */
export function CreateLayoutButton({ itemId, layouts, compact }: CreateLayoutButtonProps) {
  const t = useTranslations("floorPlan.create");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<Values, unknown, LayoutCreateInput>({
    resolver: zodResolver(createSchema, useZodMessages()),
    defaultValues: { itemId, name: "", description: "", copyFromId: NONE },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createLayoutAction({ input: values }),
    messages: { pending: common("saving"), success: t("created") },
    onSuccess: ({ value }) => {
      setOpen(false);
      router.push(layoutsRoute({ itemId, layoutId: value.id }));
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="sm">
            <PlusIcon />
            {t("button")}
          </Button>
        ) : (
          <Button>
            <PlusIcon />
            {t("button")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={submit} noValidate className="grid gap-4">
            <TextField form={form} name="name" label={t("name")} required />
            <TextField
              form={form}
              name="description"
              label={t("descriptionLabel")}
              placeholder={t("descriptionPlaceholder")}
              multiline
              rows={2}
            />
            {layouts.length ? (
              <OptionSelectField
                control={form.control}
                name="copyFromId"
                label={t("copyFrom")}
                options={layouts}
                noneLabel={t("empty")}
              />
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {common("cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {t("button")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
