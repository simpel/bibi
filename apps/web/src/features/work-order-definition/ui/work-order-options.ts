/** A row the work order form can pick: id and display name. */
export type WorkOrderOption = { id: string; name: string };

/** Choices for a work order definition, loaded on the server (`loadWorkOrderOptions`). */
export type WorkOrderOptions = {
  types: (WorkOrderOption & { fields: WorkOrderOption[] })[];
  lists: WorkOrderOption[];
  responsibilities: WorkOrderOption[];
};

export type NamesOfInput = { ids: readonly string[]; options: readonly WorkOrderOption[] };

/** Display names of the ids, in option order; unknown ids (e.g. archived) show as the id. */
export function namesOf({ ids, options }: NamesOfInput): string[] {
  return ids.map((id) => options.find((option) => option.id === id)?.name ?? id);
}

export type FieldsOfTypesInput = { types: WorkOrderOptions["types"]; typeIds: readonly string[] };

/** The fields a work order can show: those of the chosen item types. */
export function fieldsOfTypes({ types, typeIds }: FieldsOfTypesInput): WorkOrderOption[] {
  return types.filter((type) => typeIds.includes(type.id)).flatMap((type) => type.fields);
}
