import type { Meta, StoryObj } from "@storybook/react-vite";
import { Wordmark } from "./wordmark";

const meta = {
  title: "Components/Wordmark",
  component: Wordmark,
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"],
    },
    label: {
      control: "text",
    },
  },
} satisfies Meta<typeof Wordmark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PresetSizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <div className="flex items-center gap-4">
        <span className="w-12 text-xs text-muted-foreground">xs</span>
        <Wordmark size="xs" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-12 text-xs text-muted-foreground">sm</span>
        <Wordmark size="sm" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-12 text-xs text-muted-foreground">md</span>
        <Wordmark size="md" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-12 text-xs text-muted-foreground">lg</span>
        <Wordmark size="lg" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-12 text-xs text-muted-foreground">xl</span>
        <Wordmark size="xl" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-12 text-xs text-muted-foreground">2xl</span>
        <Wordmark size="2xl" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-12 text-xs text-muted-foreground">3xl</span>
        <Wordmark size="3xl" />
      </div>
    </div>
  ),
};

export const CustomNumericSize: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Wordmark size={28} />
      <Wordmark size={56} />
      <Wordmark size={100} />
    </div>
  ),
};

export const Colored: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Wordmark size="lg" className="text-primary" />
      <Wordmark size="lg" className="text-destructive" />
      <Wordmark size="lg" className="text-muted-foreground" />
    </div>
  ),
};
