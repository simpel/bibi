import { listMembers, listRoles } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { MemberTable } from "./member-table";

export type MemberListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 50;

/** Members page body: staff table with role assignment for member admins. */
export async function MemberList({ locale, cursor }: MemberListProps) {
  const t = await getTranslations("member");
  const { memberAdmin } = await getCallerAbilities();
  const [members, roles] = await Promise.all([
    runOperation({
      operation: listMembers,
      input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
    }),
    runOperation({ operation: listRoles, input: { limit: 100 } }),
  ]);
  const header = <PageHeader title={t("plural")} description={t("listDescription")} />;
  if (!members.ok) {
    const errorKey = handleLoadError({ error: members.error, locale });
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={errorKey} />
      </div>
    );
  }
  const roleNames = roles.ok
    ? roles.value.items.filter((role) => !role.system).map((role) => role.name)
    : [];
  return (
    <div className="grid gap-6">
      {header}
      {members.value.items.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <MemberTable members={members.value.items} roleNames={roleNames} canAdmin={memberAdmin} />
      )}
      <CursorPagination
        pathname={ROUTES.settingsMembers}
        cursor={cursor}
        nextCursor={members.value.nextCursor}
      />
    </div>
  );
}
