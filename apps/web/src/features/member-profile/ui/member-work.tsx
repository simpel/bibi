import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FactList } from "@/components/typed-fields/fact-list";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadMemberWork } from "../load-member-work";
import { MemberWorkForm } from "./member-work-form";

export type MemberWorkProps = { locale: Locale; memberId: string };

/**
 * On a member's page: how colleagues here reach them (ADR 0072), positions (types of the linked
 * staff items) and schedule kind (ADR 0068).
 */
export async function MemberWork({ locale, memberId }: MemberWorkProps) {
  const t = await getTranslations("memberProfile");
  const abilities = await getCallerAbilities();
  const canWrite = can({ abilities, permission: "item:write" });
  const work = await loadMemberWork({ memberId, withOptions: canWrite });
  if (!work.ok) return <ErrorState errorKey={handleLoadError({ error: work.error, locale })} />;
  const { profile, positions, options } = work.value;
  const none = t("none");
  const facts = [
    { label: t("phone"), value: profile.phone ?? none },
    { label: t("email"), value: profile.email ?? none },
    { label: t("positions"), value: positions.join(", ") || none },
    { label: t("scheduleKind"), value: t(`scheduleKinds.${profile.scheduleKind}`) },
    { label: t("staffItems"), value: profile.items.map(({ name }) => name).join(", ") || none },
  ];
  return (
    <section className="grid gap-4">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <FactList facts={facts} />
      {canWrite ? (
        <MemberWorkForm
          memberId={memberId}
          saved={{
            scheduleKind: profile.scheduleKind,
            phone: profile.phone ?? "",
            email: profile.email ?? "",
            itemIds: profile.items.map((i) => i.itemId),
          }}
          options={options}
        />
      ) : null}
    </section>
  );
}
