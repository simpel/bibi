import "server-only";
import { listCustomers, listTasks } from "@bibi/core";
import { toIsoDate, toZonedParts } from "@bibi/core/schemas";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";

const HOUR_MS = 60 * 60 * 1000;

/**
 * The caller's tasks around `today` (ADR 0117): a window wide enough for any zone, cut to the
 * day once the timeline's zone is known (`todayTasksOf`). Null without `task:read`. Two reads,
 * beside `myWork.view` in the page's one `Promise.all`.
 */
export async function loadTodayTasks({ today }: { today: string }) {
  const abilities = await getCallerAbilities();
  if (!abilities.userId || !can({ abilities, permission: "task:read" })) return null;
  const midnight = new Date(`${today}T00:00:00Z`).getTime();
  const [tasks, customers] = await Promise.all([
    runOperation({
      operation: listTasks,
      input: {
        assigneeId: abilities.userId,
        from: new Date(midnight - 14 * HOUR_MS),
        to: new Date(midnight + 38 * HOUR_MS),
        limit: 100,
      },
    }),
    runOperation({ operation: listCustomers, input: { limit: 100 } }),
  ]);
  if (!tasks.ok) return null;
  return {
    canEdit: can({ abilities, permission: "task:write" }),
    tasks: tasks.value.items,
    customers: customers.ok ? customers.value.items.map(({ id, name }) => ({ id, name })) : [],
  };
}

type Loaded = NonNullable<Awaited<ReturnType<typeof loadTodayTasks>>>;

export type TodayTasksOfInput = { loaded: Loaded; today: string; timeZone: string };

/** The tasks that start (or are due) on `today` in the timeline's zone. */
export function todayTasksOf({ loaded, today, timeZone }: TodayTasksOfInput): Loaded["tasks"] {
  return loaded.tasks.filter(
    (task) =>
      toIsoDate({ date: toZonedParts({ instant: task.startsAt, timeZone }).date }) === today,
  );
}
