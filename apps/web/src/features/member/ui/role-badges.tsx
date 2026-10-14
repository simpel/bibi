import { Badge } from "@okazi/ui";

export type RoleBadgesProps = { roles: readonly string[] };

const OWNER = "owner";

/** A member's or invitation's role names; the fixed owner role is outlined. */
export function RoleBadges({ roles }: RoleBadgesProps) {
  return (
    <ul className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <li key={role}>
          <Badge variant={role === OWNER ? "outline" : "secondary"}>{role}</Badge>
        </li>
      ))}
    </ul>
  );
}
