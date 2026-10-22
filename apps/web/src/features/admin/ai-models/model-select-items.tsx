import type { AiModel } from "@bibi/core/schemas";
import { SelectGroup, SelectItem, SelectLabel } from "@bibi/ui";
import { groupByProvider } from "./model-options";
import { ModelPrice } from "./model-price";

export type ModelSelectItemsProps = { models: readonly AiModel[] };

/** Possible models grouped by provider, each with its price per million tokens. */
export function ModelSelectItems({ models }: ModelSelectItemsProps) {
  return groupByProvider({ models }).map(({ provider, models: entries }) => (
    <SelectGroup key={provider}>
      <SelectLabel>{provider}</SelectLabel>
      {entries.map((model) => (
        <SelectItem key={model.id} value={model.id}>
          <span className="flex w-full items-center justify-between gap-6">
            <span className="truncate">{model.name}</span>
            <span className="text-xs text-muted-foreground">
              <ModelPrice model={model} />
            </span>
          </span>
        </SelectItem>
      ))}
    </SelectGroup>
  ));
}
