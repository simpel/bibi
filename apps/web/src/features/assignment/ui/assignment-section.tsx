import { type AssignmentDto, listAssignments, listResponsibilities } from "@okazi/core";
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

const LIMIT = 100;

/** Responsibilities by id; empty without `responsibility:read`, then names show as "–". */
async function responsibilityNames({ enabled }: { enabled: boolean }): Promise<NamedOption[]> {
  if (!enabled) return [];
  const result = await runOperation({ operation: listResponsibilities, input: { limit: LIMIT } });
  return result.ok ? result.value.items.map(({ id, name }) => ({ id, name })) : [];
}

type FactsInput = {
  items: readonly AssignmentDto[];
  members: readonly NamedOption[];
  followers: string;
  t: Awaited<ReturnType<typeof getTranslations<"assignment">>>;
};

/** The main assignee and followers, then one fact per responsibility (default or chosen). */
async function assignmentFacts({ items, members, followers, t }: FactsInput) {
  const main = items.find((assignment) => assignment.responsibilityId === null);
  const parts = items.filter((assignment) => assignment.responsibilityId !== null);
  const names = await responsibilityNames({ enabled: parts.length > 0 });
  return [
    { label: t("assignee"), value: nameOf({ options: members, id: main?.assigneeId ?? null }) },
    { label: t("followers"), value: followers || "–" },
    ...parts.map((part) => {
      const name = nameOf({ options: names, id: part.responsibilityId });
      const who = nameOf({ options: members, id: part.assigneeId });
      const origin = part.assigneeSource === "DEFAULT" ? ` (${t("defaultFrom", { name })})` : "";
      return { label: name, value: `${who}${origin}` };
    }),
  ];
}

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
  const followerIds = main?.followers.map((follower) => follower.userId) ?? [];
  const followers = followerIds.map((id) => nameOf({ options: members, id })).join(", ");
  const facts = await assignmentFacts({ items: result.value.items, members, followers, t });
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
