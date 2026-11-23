import type { Meta, StoryObj } from "@storybook/react-vite";
import { VisualTile } from "./visual-tile";

const meta = {
  title: "Components/VisualTile",
  component: VisualTile,
  args: { icon: "wine", size: "md" },
} satisfies Meta<typeof VisualTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Icon: Story = {};
export const Fallback: Story = { args: { icon: null } };
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-3">
      <VisualTile {...args} size="xs" />
      <VisualTile {...args} size="sm" />
      <VisualTile {...args} size="md" />
      <VisualTile {...args} size="lg" />
    </div>
  ),
};
export const Image: Story = {
  args: {
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3Crect width='3' height='2' fill='%23c9a27e'/%3E%3C/svg%3E",
    alt: "Tasting room",
  },
};
