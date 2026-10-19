import { getMember } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { ArrowLeftIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { FactList } from "@/components/typed-fields/fact-list";
import { memberPermissionsRoute, memberRoute, ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";

export type MemberDetailProps = { locale: Locale; id: string };

/** `/settings/members/[id]`: a member's contact details and role, with a link to the permissions. */
export async function MemberDetail({ locale, id }: MemberDetailProps) {
  const t = await getTranslations("member");
  const role = await getTranslations("role");
  const common = await getTranslations("common");
  const format = await getFormatter();
  const abilities = await getCallerAbilities();
  const member = await runOperation({ operation: getMember, input: { id } });
  if (!member.ok) return <ErrorState errorKey={handleLoadError({ error: member.error, locale })} />;
  const { name, email, role: preset, createdAt } = member.value;
  const facts = [
    { label: t("columns.email"), value: email },
    { label: t("columns.roles"), value: preset === null ? "–" : role(preset) },
    { label: t("memberSince"), value: format.dateTime(createdAt, { dateStyle: "medium" }) },
  ];
  const permissions = can({ abilities, permission: "member:edit" }) ? (
    <Button asChild variant="outline">
      <Link href={memberPermissionsRoute({ id })}>{t("permissions")}</Link>
    </Button>
  ) : undefined;
  return (
    <div className="grid gap-6">
      <CrumbName href={memberRoute({ id })} name={name} />
      <Link
        href={ROUTES.settingsMembers}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {common("back")}
      </Link>
      <PageHeader title={name} description={t("detailDescription")} actions={permissions} />
      <FactList facts={facts} />
    </div>
  );
}
