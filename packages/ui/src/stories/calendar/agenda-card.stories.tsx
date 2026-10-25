import type { Meta, StoryObj } from "@storybook/react-vite";
import { AgendaCard } from "./agenda-card";
import { TICKET_18 } from "./calendar-data";
import { TICKET_SMALL } from "./ticket-small-data";

const meta = {
  title: "Calendar/Agenda",
  component: AgendaCard,
  args: { ticket: TICKET_18, audience: "internal", locale: "en-GB" },
  argTypes: {
    audience: { control: "inline-radio", options: ["internal", "external"] },
    ticket: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-[28rem] max-w-full font-sans">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AgendaCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Staff: state per line, buffer times as text, internal-only staffing marked. */
export const Internal: Story = {};

/** Customer: what they bought and when. No states, buffers or staffing. */
export const External: Story = { args: { audience: "external" } };

/** A small ticket without a bundle or buffers. */
export const SmallTicket: Story = { args: { ticket: TICKET_SMALL } };

/** Phone width (375px): the list needs no change; tap a line for details. */
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
