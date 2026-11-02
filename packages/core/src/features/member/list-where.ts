import type { Prisma } from "@bibi/db";
import type { z } from "zod";
import type { MemberListInputSchema } from "./schema";

type MemberListInput = z.infer<typeof MemberListInputSchema>;

/** The role filter and the name or email search of `member.list`. */
export function memberListWhere({ input }: { input: MemberListInput }): Prisma.MemberWhereInput {
  const contains = input.query ? { contains: input.query, mode: "insensitive" as const } : null;
  return {
    ...(input.role ? { role: input.role } : {}),
    ...(contains ? { user: { OR: [{ name: contains }, { email: contains }] } } : {}),
  };
}
