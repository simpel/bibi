import type { Meta, StoryObj } from "@storybook/react-vite";
import { ColorSwatch } from "./color-swatch";

const meta = {
  title: "Components/ColorSwatch",
  component: ColorSwatch,
  args: { color: "#16a34a" },
  argTypes: { size: { control: "select", options: ["sm", "md"] } },
} satisfies Meta<typeof ColorSwatch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Medium: Story = { args: { size: "md", color: "#f59e0b" } };
