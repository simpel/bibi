export type InputEntry = { key: string; value: string };

const display = ({ value }: { value: unknown }): string => {
  if (value === null || value === undefined || value === "") return "–";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
};

export type DescribeInputInput = { input: unknown };

/** The proposal's input as readable key/values (objects only; other shapes become one `value`). */
export function describeInput({ input }: DescribeInputInput): InputEntry[] {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return input === undefined ? [] : [{ key: "value", value: display({ value: input }) }];
  }
  return Object.entries(input).map(([key, value]) => ({ key, value: display({ value }) }));
}
