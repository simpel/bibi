import { mcpTool, text } from "../../tools/meta";

const LABELS = {
  dateFormat: "date format",
  clockFormat: "clock",
  numberFormat: "number format",
  currencyDisplay: "currency display",
} as const;

type Input = Partial<Record<keyof typeof LABELS, string | null>>;

/** "Set your date format to … and number format to …", naming only the fields being changed. */
const settingsSummary = ({ input }: { input: Input }) => {
  const parts = (Object.keys(LABELS) as (keyof typeof LABELS)[])
    .filter((key) => input[key] !== undefined)
    .map((key) => `${LABELS[key]} to ${text({ value: input[key] ?? "the default" })}`);
  return `Set your ${parts.join(" and ") || "settings"}`;
};

export const userSettingsMcpTools = [
  mcpTool({ operation: "userSettings.get" }),
  mcpTool({
    operation: "userSettings.update",
    idempotent: true,
    summary: ({ input }) => settingsSummary({ input }),
  }),
];
