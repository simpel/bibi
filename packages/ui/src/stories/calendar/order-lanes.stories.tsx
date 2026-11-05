import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarLegend } from "../../components/availability-calendar/calendar-legend";
import { OrderLanes } from "../../components/availability-calendar/order-lanes";
import { ORDER_18 } from "./calendar-data";
import { STATES } from "./states-data";
import { ORDER_SMALL } from "./order-small-data";

const meta = {
  title: "Calendar/Lanes",
  component: OrderLanes,
  args: { order: ORDER_18, audience: "internal", locale: "en-GB" },
  argTypes: {
    audience: { control: "inline-radio", options: ["internal", "external"] },
    order: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-[56rem] max-w-full font-sans">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OrderLanes>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Staff: setup and teardown attached to each line; the axis widens to include them. */
export const Internal: Story = {
  render: (args) => (
    <div className="grid gap-3">
      <OrderLanes {...args} />
      <CalendarLegend states={[STATES.prebooked, STATES.estimated]} />
    </div>
  ),
};

/** Customer: booking times only, staffing hidden, one calm fill, no legend. */
export const External: Story = { args: { audience: "external" } };

/** A small order: the axis shrinks to fit. */
export const SmallOrder: Story = { args: { order: ORDER_SMALL } };

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
