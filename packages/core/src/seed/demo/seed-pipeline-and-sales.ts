import type { ExecuteContext } from "../../operations/context";
import type { DemoRefs } from "./demo-refs";
import { seedDemoFinance } from "./seed-finance";
import { seedDemoInbox } from "./seed-inbox";
import type { DemoCatalog } from "./seed-items";
import { seedDemoPipeline } from "./seed-pipeline";
import { seedDemoSales } from "./seed-sales";
import type { DemoOrg } from "./types";
import type { DemoUserIds } from "./users";

export type PipelineAndSalesInput = {
  context: ExecuteContext;
  org: DemoOrg;
  userIds: DemoUserIds;
  skipPipeline: boolean;
  refs: DemoRefs;
  catalog: DemoCatalog;
};

/**
 * The pipeline, then customers and tickets with their money, the inbox (ADR 0085), then the
 * accounts and the first SIE export (ADR 0077); without a pipeline (ADR 0044) only customers.
 */
export async function seedPipelineAndSales({ skipPipeline, ...input }: PipelineAndSalesInput) {
  if (!skipPipeline) {
    const pipeline = await seedDemoPipeline({
      context: input.context,
      pipeline: input.org.pipeline,
    });
    if (!pipeline.ok) return pipeline;
  }
  const sales = await seedDemoSales({ ...input, skipPipeline });
  if (!sales.ok || skipPipeline) return sales;
  const inbox = await seedDemoInbox({ context: input.context, org: input.org });
  if (!inbox.ok) return inbox;
  return seedDemoFinance({ context: input.context, org: input.org });
}
