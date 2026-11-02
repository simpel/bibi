/** A row the responsibility form can pick: id and display name. */
export type ResponsibilityOption = { id: string; name: string };

/** Choices for a responsibility, loaded on the server (`loadResponsibilityOptions`). */
export type ResponsibilityOptions = {
  types: ResponsibilityOption[];
  /** Members with their email (for their card); `id` is the user id, which assignments refer to. */
  people: (ResponsibilityOption & { email: string })[];
};
