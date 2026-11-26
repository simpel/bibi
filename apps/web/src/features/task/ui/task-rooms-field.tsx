import { Button } from "@bibi/ui";
import { PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldArray } from "react-hook-form";
import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";
import { defaultWindow } from "../lib/task-rooms";
import type { TaskFieldsForm } from "./task-fields";
import type { TaskFormData } from "./task-form-data";
import { TaskRoomFields } from "./task-room-fields";

type RoomsFieldProps = { form: TaskFieldsForm; data: TaskFormData };

/** The create form's rooms: each related, prebooked or booked (ADR 0120); all optional. */
export function TaskRoomsField({ form, data }: RoomsFieldProps) {
  const t = useTranslations("task.rooms");
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const chosen = form.watch("items").map((room) => room.itemId);
  const free = data.items.filter((item) => !chosen.includes(item.id));
  const add = () => {
    const dueAt = fromLocalInputValue({ value: form.getValues("dueAt"), timeZone: data.timeZone });
    append({
      itemId: free[0]?.id ?? "",
      hold: "RELATED",
      ...defaultWindow({ dueAt: dueAt ?? null, timeZone: data.timeZone }),
    });
  };
  return (
    <section className="grid gap-3">
      <div>
        <h2 className="text-sm font-medium">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("createHint")}</p>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="grid gap-3 rounded-md border p-3">
          <TaskRoomFields
            form={form}
            index={index}
            options={data.items.filter(
              (item) => item.id === chosen[index] || !chosen.includes(item.id),
            )}
          />
          {form.formState.errors.items?.[index]?.message ? (
            <p className="text-sm text-destructive">{t("rowInvalid")}</p>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-self-start text-muted-foreground"
            onClick={() => remove(index)}
          >
            <XIcon aria-hidden />
            {t("remove")}
          </Button>
        </div>
      ))}
      {free.length > 0 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-self-start"
          onClick={add}
        >
          <PlusIcon aria-hidden />
          {t("add")}
        </Button>
      ) : null}
    </section>
  );
}
