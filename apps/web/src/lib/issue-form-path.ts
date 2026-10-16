type IsFormPathInput = {
  /** Issue path from the server, e.g. `name` or `fields.capacity`. */
  path: string;
  values: Record<string, unknown>;
};

/** True when the issue's first path segment is a key of the form values (nested paths included). */
export function isFormPath({ path, values }: IsFormPathInput): boolean {
  const [first] = path.split(".");
  return first !== undefined && Object.hasOwn(values, first);
}
