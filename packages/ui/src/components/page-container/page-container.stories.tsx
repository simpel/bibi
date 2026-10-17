import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageContainer } from "./page-container";

const meta = {
  title: "Components/PageContainer",
  component: PageContainer,
  args: { children: <div className="h-24 rounded-md border bg-muted" /> },
  argTypes: { width: { control: "select", options: ["narrow", "default", "wide"] } },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Narrow: Story = { args: { width: "narrow" } };
export const Wide: Story = { args: { width: "wide" } };
