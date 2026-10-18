import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { type SetupTypeOption, typeFromOption } from "./setup-defaults";
import type { SetupTypeValues } from "./setup-form-schema";

export type AddTypeControlsProps = {
  /** Existing item types not in the setup yet. */
  addable: SetupTypeOption[];
  onAdd: (type: SetupTypeValues) => void;
};

const NEW_TYPE: SetupTypeOption = { id: "", name: "", bookable: false };

/** Adds an existing item type or a new one, each with the states of its template. */
export function AddTypeControls({ addable, onAdd }: AddTypeControlsProps) {
  const t = useTranslations("pipelineSetup.types");
  const addExisting = ({ id }: { id: string }) => {
    const option = addable.find((row) => row.id === id);
    if (option) onAdd(typeFromOption({ option }));
  };
  return (
    <div className="flex flex-wrap gap-2">
      {addable.length > 0 ? (
        <Select value="" onValueChange={(id) => addExisting({ id })}>
          <SelectTrigger className="w-64" aria-label={t("addExisting")}>
            <SelectValue placeholder={t("addExisting")} />
          </SelectTrigger>
          <SelectContent>
            {addable.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <Button
        type="button"
        variant="outline"
        onClick={() => onAdd(typeFromOption({ option: NEW_TYPE }))}
      >
        {t("addNew")}
      </Button>
    </div>
  );
}
