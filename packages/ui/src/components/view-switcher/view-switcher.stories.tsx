import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarClockIcon, LandmarkIcon } from "lucide-react";
import { ViewSwitcher, ViewSwitcherItem } from "./view-switcher";

const meta = {
  title: "Components/ViewSwitcher",
  component: ViewSwitcher,
} satisfies Meta<typeof ViewSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dashboards: Story = {
  render: () => (
    <ViewSwitcher aria-label="Dashboards">
      <ViewSwitcherItem
        href="#financials"
        active
        icon={<LandmarkIcon />}
        label="Financials"
        description="Invoiced, received and open money"
      />
      <ViewSwitcherItem
        href="#workload"
        icon={<CalendarClockIcon />}
        label="Workload"
        description="Pipeline, bookings and utilisation"
      />
    </ViewSwitcher>
  ),
};
