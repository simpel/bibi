import type { Meta, StoryObj } from "@storybook/react-vite";
import { Maximize2Icon, SquareArrowOutUpRightIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../button/button";
import { CompactCardHeader } from "./compact-card-header";

const meta = {
  title: "Components/CompactCardHeader",
  component: CompactCardHeader,
  decorators: [
    (Story) => (
      <div className="w-56 rounded-xl border bg-card p-3 shadow-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CompactCardHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const icon = ({ label, children }: { label: string; children: ReactNode }) => (
  <Button size="icon" variant="ghost" className="size-7 text-muted-foreground" aria-label={label}>
    {children}
  </Button>
);

/** The minimized pinned card: expand and close. */
export const Pinned: Story = {
  args: {
    title: "Hisingen Energi AB",
    subtitle: "9 000,00 kr",
    actions: (
      <>
        {icon({ label: "Expand", children: <Maximize2Icon className="size-3.5" /> })}
        {icon({ label: "Unpin", children: <XIcon className="size-3.5" /> })}
      </>
    ),
  },
};

/** A pipeline card: open the order beside the board. */
export const Pipeline: Story = {
  args: {
    title: "Västra Sjukvårdsregionen training day",
    subtitle: "Västra Sjukvårdsregionen · 7 Dec 2026",
    actions: icon({ label: "Open", children: <SquareArrowOutUpRightIcon className="size-3.5" /> }),
  },
};
