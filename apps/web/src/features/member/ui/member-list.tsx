import { type FixedRole, listMembers, type MemberDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPage } from "@/components/admin/admin-page";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import type { RowAccess } from "@/lib/can";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { assignableRoles } from "../assignable-roles";
import { InvitationList } from "./invitation-list";
import { InviteMemberButton } from "./invite-member-button";
import { MemberTable } from "./member-table";

export type MemberListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 100;

type MemberContentProps = {
  page: { items: MemberDto[]; nextCursor: string | null };
  role: FixedRole | null;
  access: RowAccess;
};

async function MemberContent({ page, role, access }: MemberContentProps) {
  const t = await getTranslations("member");
  const roles = assignableRoles({ caller: role });
  if (page.items.length === 0) return <EmptyState title={t("empty")} />;
  return <MemberTable members={page.items} roles={roles} caller={role} access={access} />;
}

/** Members page body: staff table; admins also change roles, invite and remove. */
export async function MemberList({ locale, cursor }: MemberListProps) {
  const t = await getTranslations("member");
  const abilities = await getCallerAbilities();
  const { role } = abilities;
  const canInvite = can({ abilities, permission: "member:write" });
  const members = await runOperation({
    operation: listMembers,
    input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
  });
  const invite = <InviteMemberButton roles={assignableRoles({ caller: role })} />;
  const header = (
    <AdminHeader
      title={t("plural")}
      description={t("listDescription")}
      actions={canInvite ? invite : undefined}
    />
  );
  return (
    <AdminPage header={header}>
      {members.ok ? (
        <MemberContent
          page={members.value}
          role={role}
          access={rowAccess({ abilities, feature: "member" })}
        />
      ) : (
        <ErrorState inline errorKey={handleLoadError({ error: members.error, locale })} />
      )}
      {canInvite ? <InvitationList locale={locale} /> : null}
    </AdminPage>
  );
}
