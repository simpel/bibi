import type { ExecuteContext } from "../../operations/context";
import type { DemoRefs } from "./demo-refs";
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

/** The pipeline, then customers and tickets; without a pipeline (ADR 0044) only customers. */
export async function seedPipelineAndSales({ skipPipeline, ...input }: PipelineAndSalesInput) {
  if (!skipPipeline) {
    const pipeline = await seedDemoPipeline({
      context: input.context,
      pipeline: input.org.pipeline,
    });
    if (!pipeline.ok) return pipeline;
  }
  return seedDemoSales({ ...input, skipPipeline });
}
