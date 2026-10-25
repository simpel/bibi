import type { Meta, StoryObj } from "@storybook/react-vite";
import { TICKET_18 } from "./calendar-data";
import { DayColumn } from "./day-column";

const meta = {
  title: "Calendar/Day column",
  component: DayColumn,
  args: { ticket: TICKET_18, audience: "internal", locale: "en-GB" },
  argTypes: {
    audience: { control: "inline-radio", options: ["internal", "external"] },
    ticket: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-[32rem] max-w-full font-sans">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DayColumn>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Staff: one column per item type, the bundle as a band, buffers attached. */
export const Internal: Story = {};

/** Customer: a printed program for the day. */
export const External: Story = { args: { audience: "external" } };

/** At phone width the columns stay readable down to about 360px; tap a block for details. */
export const Phone: Story = {
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-full max-w-[375px] font-sans">
        <Story />
      </div>
    ),
  ],
};
