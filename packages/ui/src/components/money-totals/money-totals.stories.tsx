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
      { key: "estimated", label: "Estimated", minor: 37_921_975, tone: "estimate" },
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
  args: { items: [{ key: "estimated", label: "Estimated", minor: 4_430_000, tone: "estimate" }] },
};

/** A page's headline figures: one tile each, with a hint and a warning tone. */
export const Large: Story = {
  args: {
    size: "lg",
    items: [
      { key: "invoiced", label: "Invoiced", minor: 5_740_000, hint: "Excl. VAT" },
      { key: "received", label: "Received", minor: 2_097_600, hint: "Net of refunds" },
      { key: "outstanding", label: "Outstanding", minor: null, fallback: "No access" },
      { key: "overdue", label: "Overdue", minor: 5_331_200, hint: "Today", tone: "destructive" },
    ],
  },
};
