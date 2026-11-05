import "server-only";
import { getMember, type MemberDto, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadMemberCached = cache(async (id: string): Promise<Result<MemberDto>> => {
  return runOperation({ operation: getMember, input: { id } });
});

export type LoadMemberInput = { id: string };

/** The member by its id, cached per request so metadata and page components share one read. */
export function loadMember({ id }: LoadMemberInput): Promise<Result<MemberDto>> {
  return loadMemberCached(id);
}
