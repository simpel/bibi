import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatCard, StatCards, type StatPoint } from "./stat-card";

const days = ["1 Nov", "2 Nov", "3 Nov", "4 Nov", "5 Nov", "6 Nov", "7 Nov"];

function series({ values, unit }: { values: number[]; unit: string }): StatPoint[] {
  return values.map((value, index) => ({
    label: days[index] ?? "",
    value,
    text: `${value.toLocaleString("sv-SE")} ${unit}`,
  }));
}

const money = series({ values: [8200, 9100, 8700, 11200, 10400, 12900, 12400], unit: "kr" });
const overdue = series({ values: [1, 1, 2, 2, 3, 3, 4], unit: "invoices" });
const flat = series({ values: [5, 5, 5, 5, 5, 5, 5], unit: "orders" });

const meta = {
  title: "Components/StatCard",
  component: StatCard,
  args: { label: "Agreed", value: "12 400 kr" },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Revenue went up, which is good. */
export const MoneyUpGood: Story = {
  args: {
    tone: "positive",
    hint: "Excluding VAT",
    series: money,
    trend: { direction: "up", tone: "good", text: "+12 %", description: "vs. previous 30 days" },
  },
};

/** Overdue went up, which is bad. */
export const OverdueUpBad: Story = {
  args: {
    label: "Overdue",
    value: "4",
    tone: "negative",
    series: overdue,
    trend: { direction: "up", tone: "bad", text: "+33 %", description: "vs. previous 30 days" },
  },
};

export const CountFlat: Story = {
  args: {
    label: "Open orders",
    value: "5",
    series: flat,
    trend: { direction: "flat", tone: "neutral", text: "0 %" },
  },
};

export const WithoutSeries: Story = {
  args: { label: "Estimated", tone: "pending", hint: "Not yet certain" },
};

export const Grid: Story = {
  render: () => (
    <StatCards>
      <StatCard
        label="Agreed"
        tone="positive"
        value="12 400 kr"
        series={money}
        trend={{ direction: "up", tone: "good", text: "+12 %" }}
      />
      <StatCard
        label="Overdue"
        tone="negative"
        value="4"
        series={overdue}
        trend={{ direction: "up", tone: "bad", text: "+33 %" }}
      />
      <StatCard
        label="Open orders"
        value="5"
        series={flat}
        trend={{ direction: "flat", tone: "neutral", text: "0 %" }}
      />
      <StatCard label="Estimated" tone="pending" value="31 000 kr" hint="Excluding VAT" />
    </StatCards>
  ),
};
