import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArchiveIcon, Trash2Icon } from "lucide-react";
import { Button } from "../button/button";
import { DangerZone, DangerZoneRow } from "./danger-zone";

const meta = {
  title: "Components/DangerZone",
  component: DangerZone,
  args: { title: "Danger area" },
} satisfies Meta<typeof DangerZone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <DangerZone {...args}>
      <DangerZoneRow
        title="Archive task"
        description="Site visit is removed from the calendar, the lists and My work."
        action={
          <Button variant="outline" className="text-destructive">
            <ArchiveIcon aria-hidden />
            Archive task
          </Button>
        }
      />
      <DangerZoneRow
        title="Delete task"
        description="Removes it for good. This cannot be undone."
        action={
          <Button variant="destructive">
            <Trash2Icon aria-hidden />
            Delete task
          </Button>
        }
      />
    </DangerZone>
  ),
};
