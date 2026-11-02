import { type AssignmentDto, listAssignments, listResponsibilities } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { type NamedOption, nameOf } from "@/components/form/named-option";
import { PersonName, type PersonOption } from "@/components/people/person-name";
import { PersonNames } from "@/components/people/person-names";
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
  /** Members by user id (member.list) with their email; empty without `member:read`. */
  members: readonly PersonOption[];
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
  members: readonly PersonOption[];
  followers: { ids: readonly string[]; text: string };
  t: Awaited<ReturnType<typeof getTranslations<"assignment">>>;
};

/** The main assignee and followers, then one fact per responsibility (default or chosen). */
async function assignmentFacts({ items, members, followers, t }: FactsInput) {
  const main = items.find((assignment) => assignment.responsibilityId === null);
  const parts = items.filter((assignment) => assignment.responsibilityId !== null);
  const names = await responsibilityNames({ enabled: parts.length > 0 });
  const assignee = main?.assigneeId ?? null;
  return [
    {
      label: t("assignee"),
      value: nameOf({ options: members, id: assignee }),
      node: <PersonName options={members} id={assignee} description={t("assignee")} />,
    },
    {
      label: t("followers"),
      value: followers.text || "–",
      ...(followers.ids.length > 0
        ? { node: <PersonNames ids={followers.ids} options={members} /> }
        : {}),
    },
    ...parts.map((part) => {
      const name = nameOf({ options: names, id: part.responsibilityId });
      const who = nameOf({ options: members, id: part.assigneeId });
      const origin = part.assigneeSource === "DEFAULT" ? ` (${t("defaultFrom", { name })})` : "";
      const node = (
        <>
          <PersonName options={members} id={part.assigneeId} description={name} />
          {origin}
        </>
      );
      return { label: name, value: `${who}${origin}`, node };
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
  const facts = await assignmentFacts({
    ...{ items: result.value.items, members, t },
    followers: { ids: followerIds, text: followers },
  });
  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl">{t("title")}</h2>
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
