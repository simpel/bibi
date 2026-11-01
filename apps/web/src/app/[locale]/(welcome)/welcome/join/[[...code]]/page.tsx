import { listDevInvitationCodes } from "@bibi/auth";
import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { InviteCodeStep } from "@/features/welcome/ui/join/invite-code-step";
import { requireAnySession } from "@/server/auth-pages";

type JoinRouteProps = { params: Promise<{ locale: string; code?: string[] }> };

/** `/welcome/join[/<code>]`: join through an invite code, prefilled from the mailed link (ADR 0078). */
export default async function JoinRoute({ params }: JoinRouteProps) {
  const { locale: value, code } = await params;
  const locale = resolveLocale({ value });
  setRequestLocale(locale);
  const { session } = await requireAnySession({ locale });
  // Development only (empty otherwise): the codes the invitation mail would carry.
  const devCodes = await listDevInvitationCodes({ email: session.user.email });
  return <InviteCodeStep code={code?.[0] ?? ""} devCodes={devCodes} />;
}
