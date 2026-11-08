"use client";

import type { OrganizationProfileDto } from "@bibi/core/schemas";
import { Switch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { AdminSection } from "@/components/admin/admin-section";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { setDomainJoinAction } from "../actions";

export type DomainJoinSwitchProps = {
  /** The claimed domain, or null when none is claimed yet. */
  emailDomain: string | null;
  enabled: boolean;
  /** `member:write`: admins only (ADR 0078). */
  canEdit: boolean;
  /** After a save; without it the page refreshes. The assistant's card keeps the new value. */
  onSaved?: (input: { value: OrganizationProfileDto }) => void;
};

/** Domain join on or off, saved at once with a toast; shared with the assistant's card. */
export function DomainJoinSwitch({
  emailDomain,
  enabled,
  canEdit,
  onSaved,
}: DomainJoinSwitchProps) {
  const t = useTranslations("organizationSettings.domainJoin");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const on = enabled && emailDomain !== null;
  const change = ({ checked }: { checked: boolean }) =>
    run({
      action: () => setDomainJoinAction({ input: { enabled: checked } }),
      messages: { pending: common("saving"), success: checked ? t("turnedOn") : t("turnedOff") },
      onSuccess: ({ value }) => (onSaved ? onSaved({ value }) : router.refresh()),
    });
  return (
    <Switch
      aria-label={t("label")}
      checked={on}
      disabled={!canEdit || pending}
      onCheckedChange={(checked) => change({ checked })}
    />
  );
}

export type DomainJoinFormProps = Omit<DomainJoinSwitchProps, "onSaved">;

/**
 * Domain join (ADR 0078): colleagues with a verified email at the organization's domain join as
 * members when they sign in. It is only on in practice while a domain is claimed.
 */
export function DomainJoinForm({ emailDomain, enabled, canEdit }: DomainJoinFormProps) {
  const t = useTranslations("organizationSettings.domainJoin");
  return (
    <AdminSection
      section="domainJoin"
      description={emailDomain ? t("hint", { domain: emailDomain }) : t("noDomain")}
      actions={<DomainJoinSwitch emailDomain={emailDomain} enabled={enabled} canEdit={canEdit} />}
    />
  );
}
