"use client";

import { VocabularyAddValueInputSchema } from "@bibi/core/schemas";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
} from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { addValueAction } from "@/features/vocabulary/actions";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";

export type CreateListValueDialogProps = {
  list: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The new value, to select it in the field that asked. */
  onCreated: (input: { value: { id: string; name: string } }) => void;
};

type Values = { vocabularyId: string; name: string };

/**
 * Adds a value to one of the organization's lists from a choice field (`vocabulary.addValue`),
 * selects it and refreshes the page so every form knows it.
 */
export function CreateListValueDialog({
  list,
  open,
  onOpenChange,
  onCreated,
}: CreateListValueDialogProps) {
  const t = useTranslations("common.listValue");
  const common = useTranslations("common");
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const form = useForm<Values>({
    resolver: zodResolver(
      VocabularyAddValueInputSchema.pick({ vocabularyId: true, name: true }),
      useZodMessages(),
    ),
    defaultValues: { vocabularyId: list.id, name: "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => addValueAction(values),
    messages: { pending: common("saving"), success: t("created") },
    onSuccess: ({ value, values }) => {
      const name = values.name.trim().toLocaleLowerCase();
      const created = value.values.findLast((option) => option.name.toLocaleLowerCase() === name);
      if (created) onCreated({ value: { id: created.id, name: created.name } });
      form.reset({ vocabularyId: list.id, name: "" });
      onOpenChange(false);
      startRefresh(() => router.refresh());
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { list: list.name })}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className="grid gap-4"
            // The dialog sits inside another form in React's tree: keep its submit to itself.
            onSubmit={(event) => {
              event.stopPropagation();
              return submit(event);
            }}
          >
            <TextField form={form} name="name" label={t("name")} required />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {common("cancel")}
              </Button>
              <Button type="submit" disabled={pending || refreshing}>
                {t("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
