import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarLegend } from "../../components/availability-calendar/calendar-legend";
import { AgendaCard } from "./agenda-card";
import { ASSETS, BOOKINGS } from "./availability-data";
import { TICKET_18 } from "./calendar-data";
import { CalendarRules } from "./calendar-rules";
import { CalendarSymbols } from "./calendar-symbols";
import { LiveCalendar } from "./live-calendar";
import { STATES } from "./states-data";
import { TicketLanes } from "./ticket-lanes";

const meta = {
  title: "Calendar/Overview",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The rules: what each component answers and where it is used, for staff and for customers. */
export const Rules: Story = { render: () => <CalendarRules /> };

/** Every symbol and what it means. Hue = stage of the state, fill and edge = hold. */
export const Symbols: Story = { render: () => <CalendarSymbols /> };

/** One ticket through the language: what staff see, what the customer sees, and the venue view. */
export const OneTicketEverywhere: Story = {
  render: () => (
    <div className="grid max-w-6xl gap-8 font-sans">
      <CalendarLegend states={[STATES.prebooked, STATES.estimated]} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="grid content-start gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">Internal: ticket page</h3>
          <AgendaCard ticket={TICKET_18} audience="internal" />
        </section>
        <section className="grid content-start gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">External: payment page</h3>
          <AgendaCard ticket={TICKET_18} audience="external" />
        </section>
      </div>
      <section className="grid gap-3">
        <h3 className="text-sm font-medium text-muted-foreground">Internal: Program section</h3>
        <TicketLanes ticket={TICKET_18} audience="internal" />
      </section>
      <section className="grid gap-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Internal: main calendar (availability), where every booking opens its ticket
        </h3>
        <LiveCalendar assets={ASSETS} template={BOOKINGS} />
      </section>
    </div>
  ),
};
