import { type FixedRole, getPermissions, presetPermissions } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { assignableRoles, canManageMember } from "@/features/member/assignable-roles";
import { apiKeyRoute, memberRoute, ROUTES } from "@/lib/routes";
import { type CallerAbilities, can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { findSubjectName, type SubjectType } from "../subject";
import { PermissionForm } from "./permission-form";
import { PresetForm } from "./preset-form";

type CanChangePresetInput = {
  abilities: CallerAbilities;
  isMember: boolean;
  preset: FixedRole | null;
};

/** Whether the caller may give another preset: the edit permission and a role that reaches it. */
function canChangePreset({ abilities, isMember, preset }: CanChangePresetInput): boolean {
  const permission = isMember ? "member:write" : "apiKey:write";
  return (
    can({ abilities, permission }) && canManageMember({ caller: abilities.role, member: preset })
  );
}

export type PermissionPageProps = { locale: Locale; subjectType: SubjectType; subjectId: string };

/**
 * `/settings/members/[id]/permissions` and `/settings/api-keys/[id]/permissions`: the preset and
 * the features × actions grid of one member or API key (ADR 0050). Admins only; all auto-saves.
 */
export async function PermissionPage({ locale, subjectType, subjectId }: PermissionPageProps) {
  const t = await getTranslations("permissions");
  const abilities = await getCallerAbilities();
  if (!can({ abilities, permission: "member:write" })) return <ErrorState errorKey="forbidden" />;
  const subject = { subjectType, subjectId };
  const name = await findSubjectName(subject);
  if (name === null) notFound();
  const profile = await runOperation({ operation: getPermissions, input: subject });
  if (!profile.ok) {
    return <ErrorState errorKey={handleLoadError({ error: profile.error, locale })} />;
  }
  const isMember = subjectType === "member";
  const detailHref = isMember ? memberRoute({ id: subjectId }) : apiKeyRoute({ id: subjectId });
  const { preset, effective } = profile.value;
  return (
    <FormPageShell
      backHref={isMember ? detailHref : ROUTES.adminApiKeys}
      title={t("title", { name })}
      description={t(isMember ? "memberDescription" : "apiKeyDescription")}
    >
      <CrumbName href={detailHref} name={name} />
      <PresetForm
        {...subject}
        preset={preset}
        name={name}
        roles={assignableRoles({ caller: abilities.role })}
        disabled={!canChangePreset({ abilities, isMember, preset })}
      />
      <PermissionForm
        key={preset ?? "none"}
        {...subject}
        preset={presetPermissions({ preset })}
        effective={effective}
      />
    </FormPageShell>
  );
}
