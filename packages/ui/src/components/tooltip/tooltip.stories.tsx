import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

const meta = { title: "Components/Tooltip", component: Tooltip } satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hovra</Button>
        </TooltipTrigger>
        <TooltipContent>Visar mer information</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
