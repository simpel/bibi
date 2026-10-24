import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import {
  cellsFromTemplate,
  statesFromTemplate,
  statusesFromTemplate,
} from "../src/features/pipeline-setup/draft-from-templates";
import {
  activatePipelineSetup,
  createExecuteContext,
  execute,
  grantAll,
  listEntityTypes,
  listTicketStatuses,
} from "../src/index";
import { lindholmen } from "../src/seed/demo/data/lindholmen/lindholmen";
import { seedDemo } from "../src/seed/demo/seed-demo";
import { unwrap } from "./helpers";

const adminOf = ({ organizationId }: { organizationId: string }) =>
  createExecuteContext({
    organizationId,
    roles: ["admin"],
    permissions: grantAll({}),
    actor: { type: "user", userId: `user_${createId()}` },
  });

describe("guided setup from the empty demo (seed:demo --skip-pipeline)", {
  timeout: 60_000,
}, () => {
  it("seeds item types without a pipeline, then activates one in a single batch", async () => {
    const org = { ...lindholmen, slug: `${lindholmen.slug}-${createId().slice(0, 8)}` };
    const seeded = unwrap({ result: await seedDemo({ orgs: [org], skipPipeline: true }) });
    const organizationId = seeded.organizations[0]?.organizationId ?? "";
    const context = adminOf({ organizationId });
    const statuses = { operation: listTicketStatuses, input: {}, context };
    expect(unwrap({ result: await execute(statuses) }).items).toEqual([]);
    const listed = await execute({
      operation: listEntityTypes,
      input: { base: "ITEM", limit: 100 },
      context,
    });
    const itemTypes = unwrap({ result: listed }).items.map((type) => {
      const bookable = type.capabilities.includes("BOOKABLE");
      const template = bookable ? "bookable" : "other";
      return {
        entityTypeId: type.id,
        name: type.name,
        ...statesFromTemplate({ template, bookable }),
      };
    });
    const template = "conference-estate" as const;
    const draftStatuses = statusesFromTemplate({ template });
    const input = {
      itemTypes,
      statuses: draftStatuses,
      cells: cellsFromTemplate({ template, statuses: draftStatuses, itemTypes }),
    };
    unwrap({ result: await execute({ operation: activatePipelineSetup, input, context }) });
    const after = unwrap({ result: await execute(statuses) }).items;
    expect(after.map((ticketStatus) => ticketStatus.name)).toEqual(
      draftStatuses.map((ticketStatus) => ticketStatus.name),
    );
  });
});
