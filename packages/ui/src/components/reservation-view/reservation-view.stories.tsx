import type { Meta, StoryObj } from "@storybook/react-vite";
import { AvailabilityGrid } from "./availability-grid";
import { ReservationCard, type ReservationViewData } from "./reservation-card";
import { ReservationDayList } from "./reservation-day-list";
import { TableBlockList } from "./table-block-list";

const reservation: ReservationViewData = {
  time: "Thu 19:00–21:00",
  party: "4 guests",
  tables: ["12", "13"],
  name: "Sara Lind",
  state: { label: "Booked", color: "var(--primary)" },
  needs: ["Gluten 2", "Vegan 1"],
  warnings: ["Over the pace limit"],
  note: "Birthday",
};

const meta = {
  title: "Components/ReservationView",
  decorators: [
    (Story) => (
      <div className="max-w-xl font-sans">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Card: Story = {
  render: () => (
    <ReservationCard
      reservation={reservation}
      tablesLabel="Table"
      noTablesLabel="No table"
      anonymousLabel="Erased"
    />
  ),
};

export const DayList: Story = {
  render: () => (
    <ReservationDayList
      reservationsLabel="2 reservations"
      coversLabel="9 covers"
      needs={["Gluten 5", "Vegan 2"]}
      rows={[
        { ...reservation, id: "1" },
        { ...reservation, id: "2", time: "20:30", name: null, warnings: [], tables: [] },
      ]}
      emptyLabel="No reservations"
      tablesLabel="Table"
      anonymousLabel="Erased"
    />
  ),
};

export const Availability: Story = {
  render: () => (
    <AvailabilityGrid
      emptyLabel="No sittings"
      unavailableLabel="Not available"
      groups={[
        {
          id: "dinner",
          name: "Dinner",
          slots: [
            { time: "17:00", available: true, warnings: [] },
            { time: "17:30", available: false, warnings: [] },
            { time: "18:00", available: true, warnings: ["Over the pace limit"] },
          ],
        },
      ]}
    />
  ),
};

export const TableBlocks: Story = {
  render: () => (
    <TableBlockList
      emptyLabel="No blocks"
      tablesLabel="Table"
      items={[
        {
          id: "1",
          tables: ["1", "2"],
          kind: "Blocked",
          blocking: true,
          period: "Thu 17:00–22:00",
          note: "Private party",
        },
        {
          id: "2",
          tables: ["5"],
          kind: "Kept for walk-ins",
          blocking: false,
          period: "Fri 12:00–14:00",
          note: null,
        },
      ]}
    />
  ),
};
