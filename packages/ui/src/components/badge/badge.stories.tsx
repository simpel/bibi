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
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Success: Story = { args: { variant: "success", children: "Confirmed" } };
export const Warning: Story = { args: { variant: "warning", children: "Expires soon" } };
export const Destructive: Story = { args: { variant: "destructive", children: "Avbokad" } };
export const Outline: Story = { args: { variant: "outline" } };
