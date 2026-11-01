import type { TicketStatusDto, TransitionGate } from "@bibi/core/schemas";
import {
  Checkbox,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import type { FlowGatesOutput, FlowGatesValues, GateChoice } from "./flow-gates-form-schema";

export type FlowGateRowProps = {
  control: Control<FlowGatesValues, unknown, FlowGatesOutput>;
  gate: TransitionGate;
  /** The status the moves go to. */
  ticketStatus: TicketStatusDto;
  /** The statuses a move into it can start from (open statuses other than itself). */
  sources: readonly TicketStatusDto[];
};

type SourcesProps = {
  choice: GateChoice;
  sources: readonly TicketStatusDto[];
  onChange: (choice: GateChoice) => void;
};

function SourceChecklist({ choice, sources, onChange }: SourcesProps) {
  const t = useTranslations("ticketStatus.flow");
  return (
    <div className="grid gap-1 ps-6">
      {sources.map((source) => (
        <FormItem key={source.id} className="flex flex-row items-center gap-2">
          <FormControl>
            <Checkbox
              checked={choice.fromStatusIds.includes(source.id)}
              onCheckedChange={(checked) =>
                onChange({
                  ...choice,
                  fromStatusIds:
                    checked === true
                      ? [...choice.fromStatusIds, source.id]
                      : choice.fromStatusIds.filter((id) => id !== source.id),
                })
              }
            />
          </FormControl>
          <FormLabel className="text-sm font-normal">
            {t("fromStatus", { name: source.name })}
          </FormLabel>
        </FormItem>
      ))}
    </div>
  );
}

type ScopeProps = SourcesProps & { name: string };

/** Where a requirement applies: from any status, or only from the ticked statuses. */
function GateScope({ choice, name, sources, onChange }: ScopeProps) {
  const t = useTranslations("ticketStatus.flow");
  return (
    <div className="grid gap-2 ps-6">
      <Select
        value={choice.scope}
        onValueChange={(scope) =>
          onChange({ ...choice, scope: scope === "SPECIFIC" ? "SPECIFIC" : "ANY" })
        }
      >
        <SelectTrigger aria-label={t("scopeLabel", { name })} className="w-fit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ANY">{t("fromAny")}</SelectItem>
          <SelectItem value="SPECIFIC">{t("fromSpecific")}</SelectItem>
        </SelectContent>
      </Select>
      {choice.scope === "SPECIFIC" ? (
        <SourceChecklist choice={choice} sources={sources} onChange={onChange} />
      ) : null}
    </div>
  );
}

/** One requirement as a sentence ("Moving to Lost requires a reason") and where it applies. */
export function FlowGateRow({ control, gate, ticketStatus, sources }: FlowGateRowProps) {
  const t = useTranslations("ticketStatus.flow");
  const { name } = ticketStatus;
  return (
    <FormController
      control={control}
      name={`gates.${gate}`}
      render={({ field }) => {
        const choice = field.value;
        return (
          <div className="grid gap-2">
            <FormItem className="flex flex-row items-center gap-2">
              <FormControl>
                <Checkbox
                  checked={choice.on}
                  onCheckedChange={(checked) => field.onChange({ ...choice, on: checked === true })}
                />
              </FormControl>
              <FormLabel>{t(`requires.${gate}`, { name })}</FormLabel>
            </FormItem>
            {choice.on ? (
              <GateScope choice={choice} name={name} sources={sources} onChange={field.onChange} />
            ) : null}
          </div>
        );
      }}
    />
  );
}
