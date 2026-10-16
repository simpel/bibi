/** A pickable record shown by name: a customer, a contact or a member (`id` = user id). */
export type NamedOption = { id: string; name: string };

export type NameOfInput = { options: readonly NamedOption[]; id: string | null };

/** The option's name, or "–" when unset or unknown. */
export const nameOf = ({ options, id }: NameOfInput): string =>
  (id ? options.find((option) => option.id === id)?.name : undefined) ?? "–";
