import { listAssignments } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { type NamedOption, nameOf } from "@/components/form/named-option";
import { ErrorState } from "@/components/states/error-state";
import { FactList } from "@/components/typed-fields/fact-list";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import type { AssignSubject } from "./assign-form-schema";
import { AssignmentActions } from "./assignment-actions";

export type AssignmentSectionProps = {
  locale: Locale;
  subject: AssignSubject;
  /** Members by user id (member.list); empty without `member:read`. */
  members: readonly NamedOption[];
};

/** Who answers for the subject and who follows it (ADR 0034), with assign and follow. */
export async function AssignmentSection({ locale, subject, members }: AssignmentSectionProps) {
  const t = await getTranslations("assignment");
  const abilities = await getCallerAbilities();
  const { userId } = abilities;
  const result = await runOperation({ operation: listAssignments, input: subject });
  if (!result.ok && result.error.code === "FORBIDDEN") return null;
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const main = result.value.items.find((assignment) => assignment.responsibilityId === null);
  const assigneeId = main?.assigneeId ?? null;
  const followerIds = main?.followerIds ?? [];
  const followers = followerIds.map((id) => nameOf({ options: members, id })).join(", ");
  const facts = [
    { label: t("assignee"), value: nameOf({ options: members, id: assigneeId }) },
    { label: t("followers"), value: followers || "–" },
  ];
  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        {can({ abilities, permission: "ticket:write" }) ? (
          <AssignmentActions
            subject={subject}
            assigneeId={assigneeId}
            members={members}
            userId={userId}
            following={userId !== null && followerIds.includes(userId)}
          />
        ) : null}
      </div>
      <FactList facts={facts} />
    </section>
  );
}
