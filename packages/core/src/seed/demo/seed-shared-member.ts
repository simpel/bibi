import type { Db } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { getWorkingHours, setWorkingHours } from "../../features/profile/operations";
import { DEFAULT_WORKING_HOURS } from "../../features/profile/working-hours-schema";
import { createExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { grantAll } from "../../permissions/permission-set";
import type { DemoOrg } from "./types";
import { demoEmail } from "./users";

/** Lindholmen's Lena Strand also guides at Vingaleden, on weekends only (#449). */
export const SHARED_MEMBER = {
  name: "Lena Strand",
  from: "lindholmen-demo",
  to: "vingaleden-demo",
};

/** Saturday and Sunday 10:00–16:00, no break. */
const WEEKEND = [5, 6].map((weekday) => ({
  weekday,
  startMinute: 600,
  endMinute: 960,
  breakStartMinute: null,
  breakEndMinute: null,
}));

type Seeded = { org: DemoOrg; organizationId: string };

const asUser = ({
  db,
  organizationId,
  userId,
}: {
  db: Db;
  organizationId: string;
  userId: string;
}) =>
  createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "user", userId },
    db,
  });

const weekdays = ({ days }: { days: readonly { weekday: number }[] }) =>
  days.map((day) => day.weekday).join(",");

/**
 * One person in both demo organizations with different working hours in each (#449): a member of
 * Vingaleden written like Better Auth's `addMember`, then her hours there as herself, then a
 * check that each organization reads its own.
 */
export async function seedSharedMember({ db, seeded }: { db: Db; seeded: readonly Seeded[] }) {
  const from = seeded.find(({ org }) => org.slug === SHARED_MEMBER.from);
  const to = seeded.find(({ org }) => org.slug === SHARED_MEMBER.to);
  const person = from?.org.users.find((user) => user.name === SHARED_MEMBER.name);
  if (!from || !to || !person) return ok({ value: null });
  const user = await db.user.findUniqueOrThrow({
    where: { email: demoEmail({ org: from.org, user: person }) },
    select: { id: true },
  });
  const member = { organizationId: to.organizationId, userId: user.id, role: "member" };
  await db.member.create({ data: { id: createId(), ...member, createdAt: new Date() } });
  const there = asUser({ db, organizationId: to.organizationId, userId: user.id });
  const set = await execute({
    operation: setWorkingHours,
    input: { days: WEEKEND },
    context: there,
  });
  if (!set.ok) return set;
  return checkSharedMember({ db, userId: user.id, seeded: [from, to] });
}

async function checkSharedMember({
  db,
  userId,
  seeded,
}: {
  db: Db;
  userId: string;
  seeded: Seeded[];
}) {
  const expected = [weekdays({ days: DEFAULT_WORKING_HOURS }), weekdays({ days: WEEKEND })];
  for (const [index, { org, organizationId }] of seeded.entries()) {
    const context = asUser({ db, organizationId, userId });
    const read = await execute({ operation: getWorkingHours, input: {}, context });
    const got = read.ok ? weekdays({ days: read.value.days }) : "unreadable";
    if (got !== expected[index]) {
      const message = `Demo checks failed: ${SHARED_MEMBER.name} works weekdays ${got} in ${org.slug}, expected ${expected[index]}`;
      return err({ error: new AppError({ code: "INTERNAL", message }) });
    }
  }
  return ok({ value: null });
}
