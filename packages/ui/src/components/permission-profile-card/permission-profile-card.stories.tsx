import type { Meta, StoryObj } from "@storybook/react-vite";
import { PermissionProfileCard } from "./permission-profile-card";

const meta = {
  title: "Components/PermissionProfileCard",
  component: PermissionProfileCard,
  args: {
    presetTitle: "Preset",
    preset: "Manager",
    allowedTitle: "Allowed on top",
    allowed: ["Items: Edit"],
    deniedTitle: "Denied",
    denied: ["Payments: View"],
    noOverrides: "No changes from the preset.",
    effectiveTitle: "Can use",
    features: [
      { label: "Tickets", actions: "View, Create, Edit" },
      { label: "Items", actions: "View, Edit" },
    ],
    hiddenTitle: "Hidden",
    hidden: ["Payments", "Audit log"],
    footer: <span className="text-primary underline">Open permissions</span>,
  },
} satisfies Meta<typeof PermissionProfileCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PresetOnly: Story = { args: { allowed: [], denied: [] } };
