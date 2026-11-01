import type { DevInvitationCode } from "@bibi/auth";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { JOIN_PATHS } from "../../lib/join-paths";

/**
 * Development only: the invite codes waiting for this email, each a link that fills in the form,
 * so the flow can be tried without the invitation mail (ADR 0078). Renders nothing when empty.
 */
export function DevInviteCodes({ codes }: { codes: DevInvitationCode[] }) {
  const t = useTranslations("dev");
  if (codes.length === 0) return null;
  return (
    <aside className="grid gap-2 rounded-md border border-dashed p-3 text-sm">
      <p className="font-medium">{t("inviteCodes")}</p>
      <ul className="grid gap-1">
        {codes.map(({ organization, code }) => (
          <li key={code} className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{organization}</span>
            <Link href={`${JOIN_PATHS.code}/${code}`} className="font-mono underline">
              {code}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
