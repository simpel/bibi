import { draftFromPreset } from "../src/features/pipeline-setup/draft-from-templates";
import type { PipelineCreateExamplesInput } from "../src/features/pipeline-setup/examples-schema";
import {
  activatePipelineSetup,
  createExecuteContext,
  type ExecuteContext,
  execute,
  PRESET_PERMISSIONS,
  provisionOrganization,
} from "../src/index";
import type { SetupPresetKey } from "../src/templates/setup-presets/setup-presets";
import { unwrap } from "./helpers";
import { addTestMemberWithUser, testOrg } from "./org-helpers";

/** A real organization provisioned like a signup, set up from `preset` by its admin member. */
export async function setUpOrg({ preset }: { preset: SetupPresetKey }): Promise<ExecuteContext> {
  const org = await testOrg();
  const { organizationId } = org;
  unwrap({ result: await provisionOrganization({ organizationId, timeZone: "Europe/Stockholm" }) });
  const { userId } = await addTestMemberWithUser({ context: org, role: "admin" });
  const context = createExecuteContext({
    organizationId,
    roles: ["admin"],
    permissions: PRESET_PERMISSIONS.admin,
    actor: { type: "user", userId },
  });
  const input = draftFromPreset({ key: preset, existingTypes: [] });
  unwrap({ result: await execute({ operation: activatePipelineSetup, input, context }) });
  return context;
}

type ExampleInputOptions = { space: string; food?: string };

/** Three example orders like the welcome flow's: a meeting, a conference and an advanced dinner. */
export const exampleInput = ({ space, food }: ExampleInputOptions): PipelineCreateExamplesInput => {
  const meal = food
    ? [{ name: "Fika", itemType: food, itemName: "Fika", unitPriceMinor: 9500 }]
    : [];
  type OrderOptions = { title: string; startsInDays: number; advance: boolean };
  const order = ({ title, startsInDays, advance }: OrderOptions) => ({
    title,
    startsInDays,
    startTime: "09:00",
    endTime: "12:00",
    headcount: 12,
    advance,
    lines: [{ name: space, itemType: space, itemName: `${space} 1`, quantity: 1 }, ...meal],
  });
  return {
    typeNames: { customer: "Company", contact: "Contact", order: "Booking", line: "Line" },
    customer: {
      name: "Example Company Ltd",
      contactName: "Anna Example",
      contactEmail: "anna@example.com",
    },
    orders: [
      order({ title: "Meeting", startsInDays: 3, advance: false }),
      order({ title: "Conference", startsInDays: 10, advance: false }),
      order({ title: "Dinner", startsInDays: 24, advance: true }),
    ],
  };
};
