"use client";

import type { OrderVersionDto } from "@bibi/core/schemas";
import { OrderVersionNameInputSchema } from "@bibi/core/schemas";
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
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { nameVersionAction } from "../actions";

type NameValues = { id: string; name: string };
type NameInput = { id: string; name: string | null };

const nameSchema = formSchema({
  schema: OrderVersionNameInputSchema,
  toInput: ({ values }: { values: NameValues }) => ({
    id: values.id,
    name: values.name.trim() || null,
  }),
});

export type NameVersionDialogProps = {
  version: OrderVersionDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Names a version so it is easy to find and keeps apart from later edits; empty removes it. */
export function NameVersionDialog({ version, open, onOpenChange }: NameVersionDialogProps) {
  const t = useTranslations("orderVersion");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<NameValues, unknown, NameInput>({
    resolver: zodResolver(nameSchema, useZodMessages()),
    defaultValues: { id: version.id, name: version.name ?? "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => nameVersionAction({ input: values }),
    messages: { pending: common("saving"), success: t("named") },
    onSuccess: () => {
      router.refresh();
      onOpenChange(false);
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("nameTitle", { number: version.number })}</DialogTitle>
          <DialogDescription>{t("nameHint")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={submit} noValidate className="grid gap-4">
            <TextField form={form} name="name" label={t("fields.name")} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
