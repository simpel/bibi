/** A row the sheet form can pick: id and display name. */
export type SheetOption = { id: string; name: string };

/** Choices for a sheet definition, loaded on the server (`loadSheetOptions`). */
export type SheetOptions = {
  types: (SheetOption & { fields: SheetOption[] })[];
  lists: SheetOption[];
  responsibilities: SheetOption[];
};

export type NamesOfInput = { ids: readonly string[]; options: readonly SheetOption[] };

/** Display names of the ids, in option order; unknown ids (e.g. archived) show as the id. */
export function namesOf({ ids, options }: NamesOfInput): string[] {
  return ids.map((id) => options.find((option) => option.id === id)?.name ?? id);
}

export type FieldsOfTypesInput = { types: SheetOptions["types"]; typeIds: readonly string[] };

/** The fields a sheet can show: those of the chosen item types. */
export function fieldsOfTypes({ types, typeIds }: FieldsOfTypesInput): SheetOption[] {
  return types.filter((type) => typeIds.includes(type.id)).flatMap((type) => type.fields);
}
