import type { LineDto } from "@bibi/core";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { rawFields } from "@/components/typed-fields/raw-fields";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { TypeSelectField } from "@/components/typed-fields/type-select-field";
import { LineChoicesSection } from "./line-choices-section";
import { OutsideHoursDialog } from "./outside-hours-dialog";
import { ProgramCoreFields } from "./program-core-fields";
import type { ProgramFormData } from "./program-form-data";
import type { ItemLock } from "./program-item-field";
import type { LineChoices } from "./use-line-choices";
import { useLineForm } from "./use-line-form";

export type LineFormProps = {
  data: ProgramFormData;
  orderId: string;
  startsAt: Date;
  line?: LineDto | undefined;
  /** Create mode: the line the new one is an add-on of (ADR 0088). */
  parent?: LineDto | undefined;
  /** Why the edited line's item cannot change, if it cannot. */
  itemLock?: ItemLock;
  /** Edit mode, an item with customisation groups: its choices, edited in the same form. */
  choices?: LineChoices | undefined;
  onDone: () => void;
};

/** First thing still missing in the open form (amber), scrolled into view once it opens. */
function useScrollToMissing() {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    ref.current
      ?.querySelector('[data-slot="missing-field"]')
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);
  return ref;
}

/** Create (type first) or edit a line, then its choices and the type's fields. */
export function LineForm({ line, itemLock, choices, ...props }: LineFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("line");
  const edit = useLineForm({ ...props, line, choices });
  const { form, submit, pending, typeOf, hours, confirmOutsideHours } = edit;
  const ref = useScrollToMissing();
  const { data, onDone } = props;
  const type = typeOf({ id: form.watch("entityTypeId") });
  return (
    <Form {...form}>
      <form ref={ref} onSubmit={submit} noValidate className="grid gap-4">
        {line ? null : (
          <TypeSelectField
            control={form.control}
            types={data.types}
            label={t("fields.type")}
            onTypeChange={(id) =>
              form.setValue("fields", rawFields({ type: typeOf({ id }), stored: {} }))
            }
          />
        )}
        {type ? (
          <ProgramCoreFields form={form} data={data} line={line} itemLock={itemLock} />
        ) : null}
        {type && edit.choices && choices ? (
          <LineChoicesSection
            form={edit.choices.form}
            item={edit.choices.item}
            quantity={choices.quantity}
          />
        ) : null}
        {type ? <TypeFields control={form.control} type={type} data={data} /> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending || !type}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
      <OutsideHoursDialog
        kind={hours.waiting?.kind ?? null}
        pending={pending}
        onConfirm={confirmOutsideHours}
        onCancel={hours.cancel}
      />
    </Form>
  );
}
