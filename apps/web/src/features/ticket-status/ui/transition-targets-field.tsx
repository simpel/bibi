import type { TicketStatusDto } from "@bibi/core/schemas";
import {
  Checkbox,
  ColorSwatch,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  Label,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { TransitionGateToggles } from "./transition-gate-toggles";
import type { TransitionsFormOutput, TransitionsFormValues } from "./transitions-form-schema";

export type TransitionTargetsFieldProps = {
  control: Control<TransitionsFormValues, unknown, TransitionsFormOutput>;
  targets: readonly TicketStatusDto[];
};

type ToggleInput = { ids: readonly string[]; id: string; on: boolean };

const toggle = ({ ids, id, on }: ToggleInput) =>
  on ? [...ids, id] : ids.filter((candidate) => candidate !== id);

type TargetRowProps = Pick<TransitionTargetsFieldProps, "control"> & {
  target: TicketStatusDto;
  ids: readonly string[];
  onChange: (ids: string[]) => void;
};

/** One target: may a ticket move there, and, when it may, the move's gates. */
function TransitionTargetRow({ control, target, ids, onChange }: TargetRowProps) {
  const on = ids.includes(target.id);
  return (
    <div className="grid gap-1">
      <div className="flex items-center gap-2 text-sm">
        <FormControl>
          <Checkbox
            id={`transition-${target.id}`}
            checked={on}
            onCheckedChange={(checked) =>
              onChange(toggle({ ids, id: target.id, on: checked === true }))
            }
          />
        </FormControl>
        <Label htmlFor={`transition-${target.id}`} className="inline-flex items-center gap-2">
          <ColorSwatch color={target.color} />
          {target.name}
        </Label>
      </div>
      {on ? <TransitionGateToggles control={control} toStatusId={target.id} /> : null}
    </div>
  );
}

/** One checkbox per other status: may a ticket move there, and with which gates? */
export function TransitionTargetsField({ control, targets }: TransitionTargetsFieldProps) {
  const t = useTranslations("ticketStatus");
  return (
    <FormController
      control={control}
      name="toStatusIds"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.transitions")}</FormLabel>
          {targets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noTargets")}</p>
          ) : null}
          {targets.map((target) => (
            <TransitionTargetRow
              key={target.id}
              control={control}
              target={target}
              ids={field.value}
              onChange={field.onChange}
            />
          ))}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
