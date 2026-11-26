import { TASK_ITEM_HOLDS } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { DateTimeField } from "@/components/date-picker/date-time-field";
import type { NamedOption } from "@/components/form/named-option";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { TaskRoomValues } from "../lib/task-rooms";

/** Any form with a list of rooms: the create form, or the dialog's single room. */
export type TaskRoomsFormValues = { items: TaskRoomValues[] };

export type TaskRoomFieldsProps<V extends FieldValues & TaskRoomsFormValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  index: number;
  /** The bookable items this row may pick. */
  options: readonly NamedOption[];
  /** Editing an existing room: its item stays, so no picker. */
  itemLocked?: boolean;
};

/**
 * One room's fields: the item, how the task uses it (related, prebook or book) and, for a hold,
 * its own from and to (independent of the due time, ADR 0120).
 */
export function TaskRoomFields<V extends FieldValues & TaskRoomsFormValues, O>({
  form,
  index,
  options,
  itemLocked = false,
}: TaskRoomFieldsProps<V, O>) {
  const t = useTranslations("task.rooms");
  const name = ({ key }: { key: keyof TaskRoomValues }) => `items.${index}.${key}` as Path<V>;
  const held = form.watch(name({ key: "hold" })) !== "RELATED";
  const holds = TASK_ITEM_HOLDS.map((id) => ({ id, name: t(`hold.${id}`) }));
  return (
    <div className="grid gap-4">
      {itemLocked ? null : (
        <OptionSelectField
          control={form.control}
          name={name({ key: "itemId" })}
          label={t("item")}
          options={options}
        />
      )}
      <OptionSelectField
        control={form.control}
        name={name({ key: "hold" })}
        label={t("mode")}
        options={holds}
      />
      <p className="-mt-2 text-sm text-muted-foreground">
        {t(`holdHint.${form.watch(name({ key: "hold" })) as TaskRoomValues["hold"]}`)}
      </p>
      {held ? (
        // Side by side only when the form itself is wide (the create page), stacked in a dialog.
        <div className="@container">
          <div className="grid gap-4 @xl:grid-cols-2">
            <DateTimeField
              form={form}
              name={name({ key: "startsAt" })}
              label={t("from")}
              required
            />
            <DateTimeField form={form} name={name({ key: "endsAt" })} label={t("to")} required />
          </div>
        </div>
      ) : null}
    </div>
  );
}
