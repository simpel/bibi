import type { Meta, StoryObj } from "@storybook/react-vite";
import { SetupPanel, type SetupPanelLabels } from "./setup-panel";

const labels: SetupPanelLabels = {
  empty: "Your first version appears here as we talk",
  note: "A starting point. You can change anything later.",
  unsaved: "Nothing is saved yet",
  sell: "What you sell",
  path: "How a request moves",
};

const meta = { title: "Components/SetupPanel", component: SetupPanel } satisfies Meta<
  typeof SetupPanel
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { itemTypes: null, phases: [], labels } };

export const Draft: Story = {
  args: {
    itemTypes: ["Conference room", "Lunch", "Activity"],
    phases: [
      { name: "Request", color: "#3b82f6" },
      { name: "Quote sent", color: "#f59e0b" },
      { name: "Confirmed", color: "#22c55e" },
      { name: "Lost", color: "#ef4444" },
    ],
    labels,
  },
};
