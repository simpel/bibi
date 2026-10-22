import { type FixedRole, listMembers, type MemberDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import type { RowAccess } from "@/lib/can";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { assignableRoles } from "../assignable-roles";
import { InvitationList } from "./invitation-list";
import { InviteMemberButton } from "./invite-member-button";
import { MemberTable } from "./member-table";

export type MemberListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 50;

type MemberContentProps = {
  page: { items: MemberDto[]; nextCursor: string | null };
  cursor?: string | undefined;
  role: FixedRole | null;
  access: RowAccess;
};

async function MemberContent({ page, cursor, role, access }: MemberContentProps) {
  const t = await getTranslations("member");
  const roles = assignableRoles({ caller: role });
  return (
    <>
      {page.items.length === 0 ? <EmptyState title={t("empty")} /> : null}
      {page.items.length > 0 ? (
        <MemberTable members={page.items} roles={roles} caller={role} access={access} />
      ) : null}
      <CursorPagination
        pathname={ROUTES.adminMembers}
        cursor={cursor}
        nextCursor={page.nextCursor}
      />
    </>
  );
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
  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("plural")}
        description={t("listDescription")}
        actions={canInvite ? invite : undefined}
      />
      {members.ok ? (
        <MemberContent
          page={members.value}
          cursor={cursor}
          role={role}
          access={rowAccess({ abilities, feature: "member" })}
        />
      ) : (
        <ErrorState errorKey={handleLoadError({ error: members.error, locale })} />
      )}
      {canInvite ? <InvitationList locale={locale} /> : null}
    </div>
  );
}
