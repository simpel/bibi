import type { Meta, StoryObj } from "@storybook/react-vite";
import { TaskChip } from "./task-chip";

const meta = {
  title: "Components/TaskChip",
  component: TaskChip,
  args: { timeLabel: "Thu 14:00", title: "Site visit" },
  decorators: [
    (Story) => (
      <div className="max-w-xs font-sans">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TaskChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
/** Overdue: the time in red text, the chip stays unfilled. */
export const Overdue: Story = {
  args: { timeLabel: "Mon 09:00", title: "Confirm menu", overdue: true },
};
export const Done: Story = { args: { done: true } };
export const Linked: Story = { args: { href: "#" } };

/** On an order card, under its filled status badge: the two never look alike. */
export const OnOrderCard: Story = {
  render: (args) => (
    <div className="grid gap-2 rounded-lg border bg-card p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">#1042 Board day</span>
        <span className="rounded-md bg-primary px-2 py-0.5 text-xs text-primary-foreground">
          Confirmed
        </span>
      </div>
      <TaskChip {...args} href="#" />
    </div>
  ),
};
