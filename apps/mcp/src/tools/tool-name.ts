export type ToToolNameInput = { operation: string };

/** `venue.create` -> `venue_create`. Search (`search`) keeps its name. */
export function toToolName({ operation }: ToToolNameInput): string {
  return operation.replaceAll(".", "_");
}
