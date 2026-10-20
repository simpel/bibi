/** A pickable record shown by name: a customer, a contact or a member (`id` = user id). */
export type NamedOption = { id: string; name: string };

export type NameOfInput = {
  options: readonly NamedOption[];
  id: string | null;
  /** Shown for a set reference when the caller may not view the options' feature. */
  hidden?: string | undefined;
};

/** The option's name, "–" when unset or unknown, or `hidden` when the options are denied. */
export const nameOf = ({ options, id, hidden }: NameOfInput): string => {
  if (id && hidden !== undefined) return hidden;
  return (id ? options.find((option) => option.id === id)?.name : undefined) ?? "–";
};
