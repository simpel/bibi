"use client";

import { Switch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { AdminSection } from "@/components/admin/admin-section";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { setDomainJoinAction } from "../actions";

export type DomainJoinFormProps = {
  /** The claimed domain, or null when none is claimed yet. */
  emailDomain: string | null;
  enabled: boolean;
  /** `member:write`: admins only (ADR 0078). */
  canEdit: boolean;
};

/**
 * Domain join (ADR 0078): colleagues with a verified email at the organization's domain join as
 * members when they sign in. It is only on in practice while a domain is claimed.
 */
export function DomainJoinForm({ emailDomain, enabled, canEdit }: DomainJoinFormProps) {
  const t = useTranslations("organizationSettings.domainJoin");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const on = enabled && emailDomain !== null;
  const change = ({ checked }: { checked: boolean }) =>
    run({
      action: () => setDomainJoinAction({ input: { enabled: checked } }),
      messages: { pending: common("saving"), success: checked ? t("turnedOn") : t("turnedOff") },
      onSuccess: () => router.refresh(),
    });
  return (
    <AdminSection
      section="domainJoin"
      description={emailDomain ? t("hint", { domain: emailDomain }) : t("noDomain")}
      actions={
        <Switch
          aria-label={t("label")}
          checked={on}
          disabled={!canEdit || pending}
          onCheckedChange={(checked) => change({ checked })}
        />
      }
    />
  );
}
