export type FieldLabelInput = { key: string };

/**
 * A sender's own field key as a label: `firstName`, `first_name` and `first-name` read
 * "First name". The key comes from outside the organization, so it is never translated.
 */
export function fieldLabel({ key }: FieldLabelInput): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-.]+/g, " ")
    .trim()
    .toLowerCase();
  if (words.length === 0) return key;
  return words.charAt(0).toUpperCase() + words.slice(1);
}
