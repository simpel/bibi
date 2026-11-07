import { listInvitations } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { AdminSection } from "@/components/admin/admin-section";
import { ErrorState } from "@/components/states/error-state";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { InvitationTable } from "./invitation-table";

export type InvitationListProps = { locale: Locale };

const PAGE_SIZE = 100;

/** Pending invitations for member admins (`member.listInvitations`). */
export async function InvitationList({ locale }: InvitationListProps) {
  const invitations = await runOperation({
    operation: listInvitations,
    input: { limit: PAGE_SIZE },
  });
  const items = invitations.ok ? invitations.value.items : [];
  // Invitations are created from the members section: an empty list is not shown.
  if (invitations.ok && items.length === 0) return null;
  const body = !invitations.ok ? (
    <ErrorState inline errorKey={handleLoadError({ error: invitations.error, locale })} />
  ) : (
    <InvitationTable invitations={items} />
  );
  return <AdminSection section="invitations">{body}</AdminSection>;
}
