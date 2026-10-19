import "server-only";
import type { Result } from "@okazi/core";
import { NONE } from "@/components/form/option-select-field";
import { type GridData, loadGridData } from "@/features/phase-grid/load-grid-data";
import { type SetupTypeOption, templateValues, typeFromOption } from "./ui/setup-defaults";
import type { SetupFormValues, SetupTypeValues } from "./ui/setup-form-schema";

export type SetupData = {
  /** Every item type of the organization, for step 1. */
  options: SetupTypeOption[];
  /** The organization's pipeline as it is, or the template for one without phases. */
  defaults: SetupFormValues;
};

type TypesOf = { data: GridData };

const optionsOf = ({ data }: TypesOf): SetupTypeOption[] =>
  data.types.map(({ type }) => ({
    id: type.id,
    name: type.name,
    bookable: type.behaviours.includes("BOOKABLE"),
  }));

/** The current types with their own states, phases and grid cells, by name. */
function currentValues({ data }: TypesOf): SetupFormValues {
  const itemTypes = data.types.map(({ type, states }): SetupTypeValues => {
    const option = optionsOf({ data }).find((row) => row.id === type.id);
    return {
      ...typeFromOption({ option: option ?? { id: type.id, name: type.name, bookable: false } }),
      stateTemplate: "",
      states: states.map(({ name, color, initial, hold, inSheets, released, expires }) => ({
        ...{ name, color, initial, hold },
        ...{ inSheets, released, expires },
      })),
      expiryState: states.find((state) => state.id === type.expiryStateId)?.name ?? NONE,
    };
  });
  const phases = data.phases.map(({ name, color, entry, terminal, ...flags }) => ({
    ...{ name, color, entry, terminal },
    requiresReason: flags.requiresReason,
    requiresAssignee: flags.requiresAssignee,
    invoiceable: flags.invoiceable,
    event: flags.event,
  }));
  const cells = data.cells.map((cell) => ({
    phase: cell.phaseName,
    type: cell.entityTypeName,
    state: cell.stateName,
  }));
  return { template: "", itemTypes, phases, cells };
}

/**
 * What the wizard starts from (ADR 0044): an organization that has phases edits its pipeline as
 * it is; one without starts from the "Conference estate" template with its item types.
 */
export async function loadSetupData(): Promise<Result<SetupData>> {
  const grid = await loadGridData();
  if (!grid.ok) return grid;
  const data = grid.value;
  const options = optionsOf({ data });
  if (data.phases.length > 0)
    return { ok: true, value: { options, defaults: currentValues({ data }) } };
  const itemTypes = options.map((option) => typeFromOption({ option }));
  const defaults = templateValues({ template: "conference-estate", itemTypes });
  return { ok: true, value: { options, defaults } };
}
