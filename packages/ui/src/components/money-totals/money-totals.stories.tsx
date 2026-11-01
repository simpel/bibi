import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoneyTotals } from "./money-totals";

const flow = {
  locales: "sv-SE",
  format: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  prefix: "",
  suffix: " kr",
};

const meta = {
  title: "Components/MoneyTotals",
  component: MoneyTotals,
  args: {
    flow,
    items: [
      { key: "confirmed", label: "Agreed", minor: 29_751_050 },
      { key: "estimated", label: "Estimated", minor: 37_921_975, estimate: true },
    ],
  },
} satisfies Meta<typeof MoneyTotals>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Beside a heading or in a toolbar: each label over its exact amount. */
export const Medium: Story = {};

/** In a lane header: amounts only, labels for tooltips and screen readers. */
export const Small: Story = { args: { size: "sm" } };

export const EstimateOnly: Story = {
  args: { items: [{ key: "estimated", label: "Estimated", minor: 4_430_000, estimate: true }] },
};
