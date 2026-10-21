import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";

const meta = { title: "Components/Popover", component: Popover } satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Visa dimensioner</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Enter the room dimensions.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
};
