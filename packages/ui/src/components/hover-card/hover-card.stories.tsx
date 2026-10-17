import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";

const meta = { title: "Components/HoverCard", component: HoverCard } satisfies Meta<
  typeof HoverCard
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">Find available space</Button>
      </HoverCardTrigger>
      <HoverCardContent>Find bookable items that fit a meeting or event.</HoverCardContent>
    </HoverCard>
  ),
};
