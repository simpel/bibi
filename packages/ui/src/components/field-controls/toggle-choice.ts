export type ToggleChoiceInput = { value: string[]; choice: string; checked: boolean; max?: number };

/** A multi-choice value after one checkbox changes, kept within `max` (1 = the new pick wins). */
export function toggleChoice({ value, choice, checked, max }: ToggleChoiceInput): string[] {
  if (!checked) return value.filter((item) => item !== choice);
  if (max === 1) return [choice];
  return max !== undefined && value.length >= max ? value : [...value, choice];
}
