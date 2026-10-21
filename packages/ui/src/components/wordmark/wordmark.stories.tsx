import type { Meta, StoryObj } from "@storybook/react-vite";
import { Wordmark } from "./wordmark";

const meta = {
  title: "Components/Wordmark",
  component: Wordmark,
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl"],
    },
    name: {
      control: "text",
    },
  },
} satisfies Meta<typeof Wordmark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Wordmark size="sm" />
      <Wordmark size="md" />
      <Wordmark size="lg" />
      <Wordmark size="xl" />
      <Wordmark size="2xl" />
    </div>
  ),
};

export const CustomContent: Story = {
  args: {
    name: "Bibi",
    size: "xl",
  },
};
