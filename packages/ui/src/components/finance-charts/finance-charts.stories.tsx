import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoneyByMonthChart } from "./money-by-month-chart";
import { AgingChart, ForwardBookedChart, RevenueByTypeChart } from "./single-series-charts";

const point = (value: number) => ({ value, text: `${value.toLocaleString("sv-SE")},00 kr` });

function MonthAndAging() {
  return (
    <>
      <MoneyByMonthChart
        label="Invoiced and received per month"
        categoryLabel="Month"
        invoicedLabel="Invoiced"
        receivedLabel="Received"
        months={[
          { label: "jan 26", invoiced: point(120000), received: point(90000) },
          { label: "feb 26", invoiced: point(80000), received: point(110000) },
          { label: "mar 26", invoiced: point(150000), received: point(70000) },
        ]}
      />
      <AgingChart
        label="Open amounts by age"
        categoryLabel="Age"
        amountLabel="Open"
        buckets={[
          { label: "Not due", point: point(50000) },
          { label: "1-30 days", point: point(20000) },
          { label: "31-60 days", point: point(8000) },
          { label: "61+ days", point: point(3000) },
        ]}
      />
    </>
  );
}

function Demo() {
  return (
    <div className="grid w-[640px] max-w-full gap-8">
      <MonthAndAging />
      <ForwardBookedChart
        label="Booked, not yet invoiced"
        categoryLabel="Month"
        valueLabel="Value"
        months={[
          { label: "apr 26", point: point(40000) },
          { label: "maj 26", point: point(65000) },
        ]}
      />
      <RevenueByTypeChart
        label="Revenue by type"
        categoryLabel="Type"
        amountLabel="Invoiced"
        types={[
          { label: "Conference room", point: point(200000) },
          { label: "Food and drink", point: point(120000) },
          { label: "Activities", point: point(45000) },
        ]}
      />
    </div>
  );
}

const meta = { title: "Components/FinanceCharts", component: Demo } satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
