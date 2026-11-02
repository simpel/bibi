import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChoiceCard } from "./choice-card";

const meta = {
  title: "Components/ChoiceCard",
  component: ChoiceCard,
  args: { title: "Half-day meeting", selected: false },
} satisfies Meta<typeof ChoiceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <ChoiceCard {...args} className="w-64">
      <span className="text-muted-foreground">Room · Coffee · Lunch</span>
      <span className="text-success">✓ Available</span>
    </ChoiceCard>
  ),
};

export const Selected: Story = { ...Default, args: { selected: true } };
export const Disabled: Story = { ...Default, args: { disabled: true } };
