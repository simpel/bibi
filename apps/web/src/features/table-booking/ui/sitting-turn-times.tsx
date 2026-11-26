import {
  Button,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@bibi/ui";
import { PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldArray } from "react-hook-form";
import type { SittingFormType } from "./sitting-weekdays-field";

type CellProps = { form: SittingFormType; index: number; name: "upToParty" | "minutes" };

function Cell({ form, index, name }: CellProps) {
  const t = useTranslations("tableBooking.sittings");
  return (
    <FormController
      control={form.control}
      name={`turnTimes.${index}.${name}`}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs text-muted-foreground">
            {t(name === "upToParty" ? "turnUpTo" : "turnMinutes")}
          </FormLabel>
          <FormControl>
            <Input {...field} inputMode="numeric" className="w-28" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** Rows of "up to N people keep the table M minutes"; the last row covers larger parties. */
export function SittingTurnTimes({ form }: { form: SittingFormType }) {
  const t = useTranslations("tableBooking.sittings");
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "turnTimes" });
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-sm font-medium">{t("turnTimes")}</legend>
      <p className="text-xs text-muted-foreground">{t("turnTimesHint")}</p>
      {fields.map((row, index) => (
        <div key={row.id} className="flex items-end gap-2">
          <Cell form={form} index={index} name="upToParty" />
          <Cell form={form} index={index} name="minutes" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("removeTurnTime")}
            disabled={fields.length === 1}
            onClick={() => remove(index)}
          >
            <XIcon />
          </Button>
        </div>
      ))}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ upToParty: "", minutes: "" })}
        >
          <PlusIcon />
          {t("addTurnTime")}
        </Button>
      </div>
    </fieldset>
  );
}
