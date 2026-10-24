import type { Meta, StoryObj } from "@storybook/react-vite";
import { TooltipProvider } from "../tooltip/tooltip";
import { RelativeTime } from "./relative-time";

const meta = {
  title: "Components/RelativeTime",
  component: RelativeTime,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof RelativeTime>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    dateTime: "2026-10-21T12:00:00.000Z",
    label: "3 days ago",
    exact: "Wednesday, October 21, 2026 at 2:00:00 PM GMT+2",
  },
};
