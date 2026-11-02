import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  args: { children: "Option" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "outline", "destructive", "success", "warning"],
    },
    hue: { control: "select", options: ["none", 1, 2, 3, 4, 5] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Success: Story = { args: { variant: "success", children: "Confirmed" } };
export const Warning: Story = { args: { variant: "warning", children: "Expires soon" } };
export const Destructive: Story = { args: { variant: "destructive", children: "Avbokad" } };
export const Outline: Story = { args: { variant: "outline" } };

/** Category colors, e.g. one per item type. */
export const Hues: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["Meal", "Drink", "Conference room", "Dish", "Activity"] as const).map((name, index) => (
        <Badge key={name} hue={((index % 5) + 1) as 1 | 2 | 3 | 4 | 5}>
          {name}
        </Badge>
      ))}
    </div>
  ),
};
