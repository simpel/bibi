"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { RoleBadge } from "@/features/member/ui/role-badge";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type MemberCardViewProps = GenerativeProps<"member-card">;

/** One staff member: name, email and role. */
export function MemberCardView({ member }: MemberCardViewProps) {
  return (
    <Card data-slot="member-card" className="shadow-none">
      <CardHeader className="gap-1 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={ROUTES.adminMembers} className="hover:underline">
            {member.name}
          </Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{member.email}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <RoleBadge role={member.role} />
      </CardContent>
    </Card>
  );
}
