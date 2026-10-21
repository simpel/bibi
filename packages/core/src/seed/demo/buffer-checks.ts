import type { LineDto } from "../../features/line/schema";
import type { ExecuteContext } from "../../operations/context";
import { allLines } from "./all-lines";
import type { DemoOrg } from "./types";

export type CheckDemoBuffersInput = { context: ExecuteContext; org: DemoOrg };

type Minutes = { setupMinutes: number | null; teardownMinutes: number | null };

const first = ({ levels }: { levels: [string, number | null | undefined][] }) =>
  levels.find(([, value]) => value != null) ?? [null, 0];

/** The buffers a line should show, read straight from the owned rows (ADR 0059). */
function expected({ line, item, type, changeover }: Expect) {
  const levels = ({ key }: { key: keyof Minutes }): [string, number | null | undefined][] => [
    ["LINE", line[key]],
    ["ITEM", item?.[key]],
    ["TYPE", type?.[key]],
  ];
  const [setupSource, setup] = first({ levels: levels({ key: "setupMinutes" }) });
  const [teardownSource, teardown] = first({ levels: levels({ key: "teardownMinutes" }) });
  const larger = changeover > (setup ?? 0);
  return {
    setup: `${larger ? changeover : setup} ${larger ? "SETUP" : setupSource}`,
    teardown: `${teardown} ${teardownSource}`,
  };
}

type Expect = { line: LineDto; item?: Minutes; type?: Minutes | null; changeover: number };

/**
 * ADR 0059: every line's effective setup and teardown minutes and their sources follow line →
 * item → type, and the setup is the larger of that and its setup's changeover time, never the sum.
 * That their holds and buffers match is the `line-holds` reconciliation's job.
 */
export async function checkDemoBuffers({ context, org }: CheckDemoBuffersInput) {
  const lines = await allLines({ context });
  if (!lines) return [`${org.slug}: could not list lines`];
  const items = await context.db.item.findMany({
    where: { id: { in: lines.flatMap((line) => (line.itemId ? [line.itemId] : [])) } },
    select: { id: true, setupMinutes: true, teardownMinutes: true, entityType: true },
  });
  const setups = await context.db.setup.findMany({ select: { id: true, changeoverMinutes: true } });
  const failures: string[] = [];
  for (const line of lines) {
    const item = items.find((candidate) => candidate.id === line.itemId);
    const changeover = setups.find((setup) => setup.id === line.setupId)?.changeoverMinutes ?? 0;
    const want = expected({ line, item, type: item?.entityType, changeover });
    const setup = `${line.effectiveSetupMinutes} ${line.setupMinutesSource}`;
    const teardown = `${line.effectiveTeardownMinutes} ${line.teardownMinutesSource}`;
    if (setup !== want.setup || teardown !== want.teardown) {
      failures.push(
        `${org.slug}: ${line.name} has buffers ${setup} / ${teardown}, ` +
          `expected ${want.setup} / ${want.teardown}`,
      );
    }
  }
  return failures;
}
