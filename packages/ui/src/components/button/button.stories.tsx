import type { Meta, StoryObj } from "@storybook/react-vite";
import { SaveIcon } from "lucide-react";
import { Button } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  args: { children: "Book room" },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
        "stripe",
        "fortnox",
      ],
    },
    size: { control: "select", options: ["default", "sm", "lg", "icon"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Destructive: Story = { args: { variant: "destructive", children: "Avboka" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Link: Story = { args: { variant: "link" } };
export const Stripe: Story = { args: { variant: "stripe", children: "Connect Stripe" } };
export const Fortnox: Story = { args: { variant: "fortnox", children: "Connect Fortnox" } };
export const Small: Story = { args: { size: "sm" } };
export const Disabled: Story = { args: { disabled: true } };
export const PendingWithIcon: Story = {
  args: {
    pending: true,
    children: (
      <>
        <SaveIcon />
        Save
      </>
    ),
  },
};
export const PendingWithoutIcon: Story = { args: { pending: true, children: "Save" } };
