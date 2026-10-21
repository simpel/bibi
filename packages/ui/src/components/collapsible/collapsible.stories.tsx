import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronRightIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";

const meta = { title: "Components/Collapsible", component: Collapsible } satisfies Meta<
  typeof Collapsible
>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Collapsible defaultOpen className="grid w-56 gap-1">
      <CollapsibleTrigger className="group flex items-center justify-between rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring">
        Work
        <ChevronRightIcon className="size-3 transition-transform group-data-[state=open]:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-1 px-3 text-sm">
        <span>Calendar</span>
        <span>Tickets</span>
      </CollapsibleContent>
    </Collapsible>
  ),
};
