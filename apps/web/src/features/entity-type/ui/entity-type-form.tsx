"use client";

import type { EntityTypeDto } from "@bibi/core";
import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createEntityTypeAction, updateEntityTypeAction } from "../actions";
import { BaseSelectField } from "./base-select-field";
import {
  type EntityTypeFormOutput,
  type EntityTypeFormValues,
  entityTypeFormDefaults,
  entityTypeFormSchema,
} from "./entity-type-form-schema";
import type { GroupOption } from "./group-select-field";
import { ItemTypeFields } from "./item-type-fields";

export type EntityTypeFormProps = {
  /** Present = edit mode (inline on the detail page), absent = create mode (dialog). */
  entityType?: EntityTypeDto | undefined;
  /** Called after a successful save; with it the form also shows a cancel button. */
  onDone?: () => void;
  /** Active item type groups to pick from; empty hides the group field. */
  groups: readonly GroupOption[];
};

type SaveInput = {
  entityType: EntityTypeDto | undefined;
  values: EntityTypeFormOutput;
  withGroup: boolean;
};

const save = ({ entityType, values, withGroup }: SaveInput) =>
  entityType
    ? updateEntityTypeAction({
        input: {
          ...{ id: entityType.id, name: values.name, pluralName: values.pluralName },
          ...{ capabilities: values.capabilities },
          ...{ resourceKind: values.resourceKind },
          ...{ setupMinutes: values.setupMinutes, teardownMinutes: values.teardownMinutes },
          ...(withGroup ? { groupId: values.groupId } : {}),
        },
      })
    : createEntityTypeAction({ input: values });

/** Create (base, name, kind, capabilities, buffers) or edit (all but the base) a type. A CONFLICT shows as a toast. */
export function EntityTypeForm({ entityType, onDone, groups }: EntityTypeFormProps) {
  const t = useTranslations("entityType");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<EntityTypeFormValues, unknown, EntityTypeFormOutput>({
    resolver: zodResolver(entityTypeFormSchema, useZodMessages()),
    defaultValues: entityTypeFormDefaults({ entityType }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ entityType, values, withGroup: groups.length > 0 }),
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
        <TextField
          form={form}
          name="pluralName"
          label={t("fields.pluralName")}
          placeholder={t("fields.pluralNamePlaceholder")}
        />
        {form.watch("base") === "ITEM" ? <ItemTypeFields form={form} groups={groups} /> : null}
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
