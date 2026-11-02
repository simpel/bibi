import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./alert";

const meta = {
  title: "Components/Alert",
  component: Alert,
  argTypes: {
    variant: { control: "select", options: ["default", "destructive", "warning"] },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <CircleAlertIcon />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>Holds expire on 12 November.</AlertDescription>
    </Alert>
  ),
};

/** A hard clash: another ticket holds the room. */
export const Destructive: Story = {
  args: { variant: "destructive" },
  render: (args) => (
    <Alert {...args}>
      <CircleAlertIcon />
      <AlertTitle>Double booked</AlertTitle>
      <AlertDescription>Morning session: #1042 holds the room 09:00–11:00.</AlertDescription>
    </Alert>
  ),
};

/** An advisory issue: outside opening hours. */
export const Warning: Story = {
  args: { variant: "warning" },
  render: (args) => (
    <Alert {...args}>
      <TriangleAlertIcon />
      <AlertTitle>Outside opening hours</AlertTitle>
      <AlertDescription>Dinner ends after the venue closes.</AlertDescription>
    </Alert>
  ),
};
