import { ContactName } from "@bibi/ui";
import { type NamedOption, nameOf } from "@/components/form/named-option";

/** A pickable person with the ways to reach them, for their contact card. */
export type PersonOption = NamedOption & { email?: string | null; phone?: string | null };

export type PersonNameProps = {
  options: readonly PersonOption[];
  id: string | null;
  /** Why this person, on their card: "Assignee", a responsibility, the customer. */
  description?: string | undefined;
  /** Off for people outside the organization (a customer's contact): they have no profile. */
  avatar?: boolean;
  /** Shown for a set reference when the caller may not view the options' feature. */
  hidden?: string | undefined;
};

/** The person's name, opening their contact card; plain "–" or `hidden` when there is none. */
export function PersonName({ options, id, description, avatar = true, hidden }: PersonNameProps) {
  const person = id && hidden === undefined ? options.find((option) => option.id === id) : null;
  if (!person) return nameOf({ options, id, hidden });
  const { name, email, phone } = person;
  return <ContactName contact={{ id: person.id, name, email, phone, description, avatar }} />;
}
