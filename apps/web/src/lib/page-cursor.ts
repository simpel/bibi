export type CursorInput = { value: string | string[] | undefined };

/** `?cursor=` search param as a plain string (first value wins); undefined = first page. */
export function readCursor({ value }: CursorInput): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first && first.length > 0 ? first : undefined;
}
