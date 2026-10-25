import type { Prisma } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { checkReadable } from "../ticket/ticket-rules";
import type { MemberProfileDto } from "./schema";

type Db = { context: Pick<OperationContext, "db" | "organizationId"> };

/** Links of archived items stay but are hidden: an archived item is no longer a position. */
export const MEMBER_PROFILE_SELECT = {
  id: true,
  memberId: true,
  scheduleKind: true,
  phone: true,
  email: true,
  avatarKey: true,
  items: {
    where: { item: { status: "ACTIVE" } },
    select: { item: { select: { id: true, name: true, entityTypeId: true } } },
    orderBy: [{ item: { name: "asc" } }, { itemId: "asc" }],
  },
} satisfies Prisma.MemberProfileSelect;

type ProfileRow = Prisma.MemberProfileGetPayload<{ select: typeof MEMBER_PROFILE_SELECT }>;

export const toMemberProfileDto = ({ row }: { row: ProfileRow }): MemberProfileDto => ({
  id: row.id,
  memberId: row.memberId,
  scheduleKind: row.scheduleKind,
  phone: row.phone,
  email: row.email,
  avatarKey: row.avatarKey,
  items: row.items.map(({ item }) => ({
    itemId: item.id,
    name: item.name,
    entityTypeId: item.entityTypeId,
  })),
});

/** What a member without a saved profile reads as: a weekly pattern and no staff items. */
export const emptyMemberProfile = ({ memberId }: { memberId: string }): MemberProfileDto => ({
  id: null,
  memberId,
  scheduleKind: "PATTERN",
  phone: null,
  email: null,
  avatarKey: null,
  items: [],
});

export type LoadMemberProfileInput = Db & { memberId: string };

/** The member's profile, or the empty one when it was never saved. */
export async function loadMemberProfile({ context, memberId }: LoadMemberProfileInput) {
  const row = await context.db.memberProfile.findFirst({
    where: { memberId },
    select: MEMBER_PROFILE_SELECT,
  });
  return row ? toMemberProfileDto({ row }) : emptyMemberProfile({ memberId });
}

export type CheckMemberInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  memberId: string;
};

/** The member must be readable by the caller and belong to this organization (`NOT_FOUND`). */
export async function checkMember({ context, memberId }: CheckMemberInput): Promise<Result<true>> {
  const readable = checkReadable({ context, permission: "member:read", path: "memberId" });
  if (!readable.ok) return readable;
  const member = await context.db.member.findFirst({
    where: { id: memberId },
    select: { id: true },
  });
  return member ? ok({ value: true }) : notFound({ entity: "Member" });
}

/** The member's profile id, creating the profile on first use. */
export async function ensureMemberProfileId({ context, memberId }: LoadMemberProfileInput) {
  const found = await context.db.memberProfile.findFirst({
    where: { memberId },
    select: { id: true },
  });
  if (found) return found.id;
  const created = await context.db.memberProfile.create({
    data: { organizationId: context.organizationId, memberId },
    select: { id: true },
  });
  return created.id;
}
