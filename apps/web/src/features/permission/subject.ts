import "server-only";
import { getApiKey, getMember } from "@okazi/core";
import { runOperation } from "@/server/run-operation";

export type SubjectType = "member" | "apiKey";

export type FindSubjectNameInput = { subjectType: SubjectType; subjectId: string };

/** The display name of a member or API key, or `null` when it does not exist (or is hidden). */
export async function findSubjectName({
  subjectType,
  subjectId,
}: FindSubjectNameInput): Promise<string | null> {
  const input = { id: subjectId };
  const result =
    subjectType === "member"
      ? await runOperation({ operation: getMember, input })
      : await runOperation({ operation: getApiKey, input });
  return result.ok ? result.value.name : null;
}
