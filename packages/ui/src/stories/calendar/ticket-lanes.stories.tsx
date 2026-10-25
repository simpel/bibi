import type { Meta, StoryObj } from "@storybook/react-vite";
import { TICKET_18 } from "./calendar-data";
import { CalendarLegend } from "./calendar-legend";
import { STATES } from "./states-data";
import { TicketLanes } from "./ticket-lanes";
import { TICKET_SMALL } from "./ticket-small-data";

const meta = {
  title: "Calendar/Lanes",
  component: TicketLanes,
  args: { ticket: TICKET_18, audience: "internal", locale: "en-GB" },
  argTypes: {
    audience: { control: "inline-radio", options: ["internal", "external"] },
    ticket: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-[56rem] max-w-full font-sans">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TicketLanes>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Staff: setup and teardown attached to each line; the axis widens to include them. */
export const Internal: Story = {
  render: (args) => (
    <div className="grid gap-3">
      <TicketLanes {...args} />
      <CalendarLegend states={[STATES.prebooked, STATES.estimated]} />
    </div>
  ),
};

/** Customer: booking times only, staffing hidden, one calm fill, no legend. */
export const External: Story = { args: { audience: "external" } };

/** A small ticket: the axis shrinks to fit. */
export const SmallTicket: Story = { args: { ticket: TICKET_SMALL } };

/** Phone width (375px): each lane stacks its name above a full-width track; tap a block for details. */
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
