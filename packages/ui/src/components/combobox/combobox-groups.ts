export type ComboboxOption = {
  value: string;
  label: string;
  description?: string;
  group?: string;
};

export type ComboboxGroupBucket = { heading: string | undefined; options: ComboboxOption[] };

export type GroupOptionsInput = { options: ComboboxOption[] };

export function groupOptions({ options }: GroupOptionsInput): ComboboxGroupBucket[] {
  const buckets = new Map<string, ComboboxGroupBucket>();
  for (const option of options) {
    const key = option.group ?? "";
    const bucket = buckets.get(key) ?? { heading: option.group, options: [] };
    bucket.options.push(option);
    buckets.set(key, bucket);
  }
  return [...buckets.values()];
}
