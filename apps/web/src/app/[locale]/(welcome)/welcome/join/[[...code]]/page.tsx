import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { InviteCodeStep } from "@/features/welcome/ui/join/invite-code-step";

type JoinRouteProps = { params: Promise<{ locale: string; code?: string[] }> };

/** `/welcome/join[/<code>]`: join through an invite code, prefilled from the mailed link (ADR 0076). */
export default async function JoinRoute({ params }: JoinRouteProps) {
  const { locale: value, code } = await params;
  const locale = resolveLocale({ value });
  setRequestLocale(locale);
  return <InviteCodeStep code={code?.[0] ?? ""} />;
}
