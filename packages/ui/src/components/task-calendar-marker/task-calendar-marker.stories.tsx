import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { TaskCalendarMarker } from "./task-calendar-marker";

const meta = {
  title: "Components/TaskCalendarMarker",
  component: TaskCalendarMarker,
  args: {
    shape: "meeting",
    label: "Site visit",
    timeLabel: "14:00",
    onClick: fn(),
    className: "absolute inset-y-1",
    style: { left: "35%", width: "25%" },
  },
  argTypes: {
    shape: { control: "inline-radio", options: ["meeting", "deadline"] },
    variant: { control: "inline-radio", options: ["span", "point"] },
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

/** A meeting covers its time on the track, outlined and unfilled. */
export const Meeting: Story = {};
export const Open: Story = {};
/** A deadline is a point: a hairline tick with the flag beside it. */
export const Deadline: Story = {
  args: { shape: "deadline", label: "Send final headcount", timeLabel: "12:00" },
};
export const Overdue: Story = {
  args: { shape: "deadline", label: "Confirm menu", timeLabel: "09:00", overdue: true },
};
export const Done: Story = { args: { done: true } };
/** Only the outline: a task's echo on its asset's row, drawn over a booking. */
export const BareOverBooking: Story = {
  args: { bare: true },
  render: (args) => (
    <>
      <span className="absolute inset-y-1 left-[30%] w-[40%] rounded-md bg-primary" />
      <TaskCalendarMarker {...args} className="absolute inset-y-0.5 z-10" />
    </>
  ),
};
