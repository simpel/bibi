import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ASSETS, BOOKINGS } from "./availability-data";
import { AvailabilityWithTicket } from "./availability-with-ticket";
import { BUSY_ASSETS } from "./busy-assets-data";
import { BUSY_BOOKINGS } from "./busy-bookings-data";
import { CalendarLegend } from "./calendar-legend";
import { LiveCalendar } from "./live-calendar";
import { STATES } from "./states-data";

const meta = {
  title: "Calendar/Availability",
  component: LiveCalendar,
  args: { assets: BUSY_ASSETS, template: BUSY_BOOKINGS, onAdd: fn(), onOpen: fn() },
  argTypes: {
    assets: { control: false },
    template: { control: false },
    initialLevel: { control: "inline-radio", options: ["day", "week", "month"] },
  },
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="grid max-w-6xl min-w-0 gap-3 font-sans">
        <Story />
        <CalendarLegend
          states={[STATES.booked, STATES.prebooked, STATES.estimated, STATES.ordered]}
          withBlocked={STATES.maintenance}
        />
      </div>
    ),
  ],
} satisfies Meta<typeof LiveCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The worst case: 26 assets in three groups, 07–23, turnovers and three clashes (red notch).
 * Point at empty time to add; click a booking to open its ticket. Ctrl-scroll or pinch to zoom;
 * scroll sideways forever, other days load as you reach them.
 */
export const WorstCase: Story = {};

/** A quiet day: five spaces and two staff. */
export const QuietDay: Story = { args: { assets: ASSETS, template: BOOKINGS } };

/** A week: thin blocks with the customer, nights shrunk to a seam, weekends on a grey ground. */
export const Week: Story = { args: { initialLevel: "week" } };

/** A month: one cell per asset and day, as tall as it is booked, red on a clash. Click to zoom in. */
export const Month: Story = { args: { initialLevel: "month" } };

const MANY = [
  "Halls",
  "Rooms",
  "Lounges",
  "Chefs",
  "Hosts",
  "Guides",
  "AV",
  "Furniture",
  "Cars",
  "Boats",
];

/** Ten groups of the org's own: the group list gets a search field above eight. */
export const ManyGroups: Story = {
  args: {
    assets: BUSY_ASSETS.map((asset, index) => ({
      ...asset,
      group: MANY[index % MANY.length] ?? asset.group,
    })),
  },
};

/** The overview and its detail: click a booking and its ticket's Program opens beside it. */
export const OpenATicket: Story = {
  render: (args) => <AvailabilityWithTicket assets={args.assets} template={args.template} />,
};

const phone: Story["decorators"] = [
  (Story) => (
    <div className="w-full max-w-[375px] min-w-0 font-sans">
      <Story />
    </div>
  ),
];

/**
 * Phone width: Day keeps readable hours and scrolls inside the day; Week keeps named blocks with
 * about three days on screen. Names stay pinned, pinch with two fingers to zoom.
 */
export const Phone: Story = { decorators: phone };

/** Phone width, a week. */
export const PhoneWeek: Story = { args: { initialLevel: "week" }, decorators: phone };

/** Phone width, a month: cells fit the screen, tap one to open the day. */
export const PhoneMonth: Story = { args: { initialLevel: "month" }, decorators: phone };
