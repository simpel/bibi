import { listInvitations } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { InvitationTable } from "./invitation-table";

export type InvitationListProps = { locale: Locale };

const PAGE_SIZE = 100;

/** Pending invitations for member admins (`member.listInvitations`). */
export async function InvitationList({ locale }: InvitationListProps) {
  const t = await getTranslations("member");
  const invitations = await runOperation({
    operation: listInvitations,
    input: { limit: PAGE_SIZE },
  });
  const body = !invitations.ok ? (
    <ErrorState errorKey={handleLoadError({ error: invitations.error, locale })} />
  ) : invitations.value.items.length === 0 ? (
    <p className="text-sm text-muted-foreground">{t("noInvitations")}</p>
  ) : (
    <InvitationTable invitations={invitations.value.items} />
  );
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold">{t("invitations")}</h2>
      {body}
    </section>
  );
}
