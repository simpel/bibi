import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const meta = { title: "Components/Sheet", component: Sheet } satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AssistantPanel: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open assistant</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Assistant</SheetTitle>
          <SheetDescription>Ask about venues, rooms and bookings.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};
