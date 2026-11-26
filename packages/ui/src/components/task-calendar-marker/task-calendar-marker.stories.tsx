import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { TaskCalendarMarker } from "./task-calendar-marker";

const meta = {
  title: "Components/TaskCalendarMarker",
  component: TaskCalendarMarker,
  args: {
    label: "Site visit",
    timeLabel: "14:00",
    onClick: fn(),
    className: "absolute inset-y-1",
    style: { left: "35%", width: "25%" },
  },
  decorators: [
    (Story) => (
      <div className="relative h-9 max-w-xl rounded-md bg-muted font-sans">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TaskCalendarMarker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A task is a point at its due time: a hairline tick with the icon beside it, never filled. */
export const Open: Story = {};
export const Overdue: Story = {
  args: { label: "Confirm menu", timeLabel: "09:00", overdue: true },
};
export const Done: Story = { args: { done: true } };
/** Only the outline: a task's echo on its room's row, drawn over a booking. */
export const BareOverBooking: Story = {
  args: { bare: true },
  render: (args) => (
    <>
      <span className="absolute inset-y-1 left-[30%] w-[40%] rounded-md bg-primary" />
      <TaskCalendarMarker {...args} className="absolute inset-y-0.5 z-10" />
    </>
  ),
};
