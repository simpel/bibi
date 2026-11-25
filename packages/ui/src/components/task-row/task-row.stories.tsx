import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { TaskRow, type TaskRowProps } from "./task-row";

const meta = {
  title: "Components/TaskRow",
  component: TaskRow,
  args: {
    shape: "meeting",
    timeLabel: "Thu 14:00",
    title: "Site visit",
    meta: "Volvo Cars · Sara",
    checkboxLabel: "Mark Site visit as done",
    onCheckedChange: fn(),
  },
  argTypes: { shape: { control: "inline-radio", options: ["meeting", "deadline"] } },
  decorators: [
    (Story) => (
      <div className="max-w-md font-sans">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TaskRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Open: no fill, a hairline in the task colour, the time first. */
export const Open: Story = {};
export const Meeting: Story = {};
export const Deadline: Story = {
  args: { shape: "deadline", timeLabel: "Fri 12:00", title: "Send final headcount" },
};
/** Done: checked, struck through and muted. */
export const Done: Story = { args: { checked: true } };
/** Overdue: the time in red text, never a red fill. */
export const Overdue: Story = {
  args: { shape: "deadline", timeLabel: "Mon 09:00", title: "Confirm menu", overdue: true },
};
/** The whole row opens the task; the checkbox stays its own target. */
export const Linked: Story = { args: { href: "#" } };
export const Compact: Story = { args: { size: "compact", meta: undefined } };

const LIST: readonly Omit<TaskRowProps, "checkboxLabel">[] = [
  { shape: "deadline", timeLabel: "Mon 09:00", title: "Confirm menu", overdue: true },
  { shape: "meeting", timeLabel: "Thu 14:00", title: "Site visit", meta: "Volvo Cars · Sara" },
  { shape: "deadline", timeLabel: "Fri 12:00", title: "Send final headcount", meta: "Mona" },
  { shape: "meeting", timeLabel: "Tue 10:00", title: "Kick-off call", checked: true },
];

/** A list as on /tasks: toggle the checkboxes. */
export const List: Story = {
  render: () => {
    const [done, setDone] = useState(() => LIST.map((task) => task.checked ?? false));
    return (
      <div className="grid gap-1.5">
        {LIST.map((task, index) => (
          <TaskRow
            key={String(task.title)}
            {...task}
            href="#"
            checked={done[index]}
            overdue={task.overdue && !done[index]}
            checkboxLabel={`Mark ${task.title} as done`}
            onCheckedChange={(checked) =>
              setDone((all) => all.map((value, at) => (at === index ? checked : value)))
            }
          />
        ))}
      </div>
    );
  },
};
