import { mcpTool, text } from "../../tools/meta";

export const organizationProfileMcpTools = [
  mcpTool({ operation: "organizationProfile.get" }),
  mcpTool({
    operation: "organizationProfile.update",
    idempotent: true,
    summary: () => "Change the organization's details",
  }),
  mcpTool({
    operation: "organizationProfile.setSetupStatus",
    idempotent: true,
    summary: ({ input }) =>
      `Set the organization's first setup to ${text({ value: input.setupStatus })}`,
  }),
];
