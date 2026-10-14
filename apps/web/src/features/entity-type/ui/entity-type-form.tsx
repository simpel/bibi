"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { EntityTypeDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createEntityTypeAction, updateEntityTypeAction } from "../actions";
import { BaseSelectField } from "./base-select-field";
import { BehaviourField } from "./behaviour-field";
import {
  type EntityTypeFormOutput,
  type EntityTypeFormValues,
  entityTypeFormDefaults,
  entityTypeFormSchema,
} from "./entity-type-form-schema";

export type EntityTypeFormProps = {
  /** Present = edit mode (inline on the detail page), absent = create mode (dialog). */
  entityType?: EntityTypeDto | undefined;
  /** Called after a successful save; with it the form also shows a cancel button. */
  onDone?: () => void;
};

type SaveInput = { entityType: EntityTypeDto | undefined; values: EntityTypeFormOutput };

const save = ({ entityType, values }: SaveInput) =>
  entityType
    ? updateEntityTypeAction({
        input: { id: entityType.id, name: values.name, behaviours: values.behaviours },
      })
    : createEntityTypeAction({ input: values });

/** Create (base, name, behaviours) or edit (name, behaviours) a type. A CONFLICT shows as a toast. */
export function EntityTypeForm({ entityType, onDone }: EntityTypeFormProps) {
  const t = useTranslations("entityType");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<EntityTypeFormValues, unknown, EntityTypeFormOutput>({
    resolver: zodResolver(entityTypeFormSchema, useZodMessages()),
    defaultValues: entityTypeFormDefaults({ entityType }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ entityType, values }),
    messages: { pending: t("saving"), success: t(entityType ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone?.();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {entityType ? null : <BaseSelectField control={form.control} />}
        <TextField form={form} name="name" label={t("fields.name")} required />
        {form.watch("base") === "ITEM" ? <BehaviourField control={form.control} /> : null}
        <div className="flex justify-end gap-2">
          {onDone ? (
            <Button type="button" variant="outline" onClick={onDone}>
              {common("cancel")}
            </Button>
          ) : null}
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
