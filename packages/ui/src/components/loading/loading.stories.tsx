import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import { Loading } from "./loading";

const meta = {
  title: "Components/Loading",
  component: Loading,
  args: { label: "Loading" },
  argTypes: {
    size: { control: "select", options: ["icon", "sm", "md", "lg", "xl", "2xl"] },
  },
} satisfies Meta<typeof Loading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-8">
      {(["icon", "sm", "md", "lg", "xl", "2xl"] as const).map((size) => (
        <Loading key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const InButtons: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <Button disabled>
        <Loading {...args} size="icon" />
        Saving
      </Button>
      <Button variant="outline" disabled>
        <Loading {...args} size="icon" />
        Loading
      </Button>
      <Button size="icon" variant="secondary" disabled>
        <Loading {...args} size="icon" />
      </Button>
    </div>
  ),
};

export const Large: Story = { args: { size: "2xl" } };

export const FullPage: Story = {
  render: (args) => (
    <div className="flex h-96 items-center justify-center rounded-lg border">
      <Loading {...args} />
    </div>
  ),
};
