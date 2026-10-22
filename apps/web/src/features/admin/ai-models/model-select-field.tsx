import type { AiModel } from "@bibi/core/schemas";
import {
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@bibi/ui";
import type { Control } from "react-hook-form";
import { ModelSelectItems } from "./model-select-items";

export type ModelFormValues = { modelId: string };

export type ModelSelectFieldProps = {
  control: Control<ModelFormValues>;
  label: string;
  placeholder: string;
  models: readonly AiModel[];
  disabled: boolean;
  /** Called with the picked id after the field value changed (auto-save). */
  onPick: (modelId: string) => void;
};

/** The shadcn form field: a select of the possible models, validation via `FormMessage`. */
export function ModelSelectField(props: ModelSelectFieldProps) {
  return (
    <FormController
      control={props.control}
      name="modelId"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="sr-only">{props.label}</FormLabel>
          <Select
            value={field.value}
            disabled={props.disabled}
            onValueChange={(value) => {
              field.onChange(value);
              props.onPick(value);
            }}
          >
            <FormControl>
              <SelectTrigger className="w-full min-w-64">
                <SelectValue placeholder={props.placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="max-h-96">
              <ModelSelectItems models={props.models} />
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
