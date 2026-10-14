"use client";

import { Link } from "@okazi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type MemberCardViewProps = GenerativeProps<"member-card">;

/** One staff member: name, email and roles. */
export function MemberCardView({ member }: MemberCardViewProps) {
  return (
    <Card data-slot="member-card" className="shadow-none">
      <CardHeader className="gap-1 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={ROUTES.settingsMembers} className="hover:underline">
            {member.name}
          </Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{member.email}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ul className="flex flex-wrap gap-1">
          {member.roles.map((role) => (
            <li key={role}>
              <Badge variant="secondary">{role}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
