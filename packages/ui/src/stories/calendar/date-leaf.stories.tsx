import type { Meta, StoryObj } from "@storybook/react-vite";
import { DateLeaf } from "../../components/availability-calendar/date-leaf";

const meta = {
  title: "Calendar/Date leaf",
  component: DateLeaf,
  args: { date: "2026-11-12", size: "sm", locale: "en-GB", withYear: false },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    locale: { control: "inline-radio", options: ["en-GB", "sv-SE"] },
  },
} satisfies Meta<typeof DateLeaf>;

export default meta;
type Story = StoryObj<typeof meta>;

/** sm: internal headers and lists. The year only when it is not this year. */
export const Small: Story = {};

/** md with year: customer-facing pages and documents. */
export const Medium: Story = { args: { size: "md", withYear: true } };

/** Swedish: month and weekday follow the locale. */
export const Swedish: Story = { args: { locale: "sv-SE" } };

/** In context: a ticket list row. */
export const InListRow: Story = {
  render: (args) => (
    <div className="flex w-96 items-center gap-3 rounded-lg border bg-card p-3 font-sans">
      <DateLeaf {...args} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">Ticket 18 · Sales conference</p>
        <p className="truncate text-xs text-muted-foreground">
          Hisingen Energi AB · 09:00–17:00 · 24 guests
        </p>
      </div>
    </div>
  ),
};
