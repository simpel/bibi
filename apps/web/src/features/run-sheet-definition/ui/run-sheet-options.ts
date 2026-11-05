/** A row the run sheet form can pick: id and display name. */
export type RunSheetOption = { id: string; name: string };

/** Choices for a run sheet definition, loaded on the server (`loadRunSheetOptions`). */
export type RunSheetOptions = {
  types: (RunSheetOption & { fields: RunSheetOption[] })[];
  lists: RunSheetOption[];
  responsibilities: RunSheetOption[];
};

export type NamesOfInput = { ids: readonly string[]; options: readonly RunSheetOption[] };

/** Display names of the ids, in option order; unknown ids (e.g. archived) show as the id. */
export function namesOf({ ids, options }: NamesOfInput): string[] {
  return ids.map((id) => options.find((option) => option.id === id)?.name ?? id);
}

export type FieldsOfTypesInput = { types: RunSheetOptions["types"]; typeIds: readonly string[] };

/** The fields a run sheet can show: those of the chosen item types. */
export function fieldsOfTypes({ types, typeIds }: FieldsOfTypesInput): RunSheetOption[] {
  return types.filter((type) => typeIds.includes(type.id)).flatMap((type) => type.fields);
}
