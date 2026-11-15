/** `?page=` as a page from 1; anything else is the first page. */
export function pageParam({ value }: { value: string | string[] | undefined }): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page >= 1 && page <= 10_000 ? page : 1;
}
