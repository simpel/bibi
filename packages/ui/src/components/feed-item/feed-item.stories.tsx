import type { Meta, StoryObj } from "@storybook/react-vite";
import { CheckIcon, ClipboardListIcon, HandCoinsIcon, InboxIcon, OctagonXIcon } from "lucide-react";
import { Button } from "../button/button";
import { FeedItem } from "./feed-item";

const meta = {
  title: "Components/FeedItem",
  component: FeedItem,
  args: {
    icon: HandCoinsIcon,
    href: "#",
    title: "Anna paid 12 400 kr on #1042",
    meta: "#1042 Board day · 5 minutes ago",
  },
  argTypes: { tone: { control: "select", options: ["default", "warning", "destructive"] } },
} satisfies Meta<typeof FeedItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Unread: Story = {
  args: {
    emphasis: true,
    marker: <span className="block size-2 rounded-full bg-destructive" />,
  },
};
export const Read: Story = { args: { muted: true } };
/** Hover the row: a dismiss button shows over its end, outside the link. */
export const WithAction: Story = {
  args: {
    emphasis: true,
    action: (
      <Button variant="ghost" size="icon" className="size-7" aria-label="Dismiss">
        <CheckIcon />
      </Button>
    ),
  },
};

/** A list of tasks and notifications side by side: the same subject has the same icon. */
export const List: Story = {
  render: () => (
    <div className="grid max-w-sm gap-0.5 rounded-xl border p-1">
      <FeedItem
        icon={OctagonXIcon}
        tone="destructive"
        emphasis
        href="#"
        title="Fix double booking on Hall A with #1038"
        meta="#1042 Board day · Due in 2 hours"
      />
      <FeedItem
        icon={ClipboardListIcon}
        tone="warning"
        emphasis
        href="#"
        title="Send Kitchen order"
        meta="#1040 Wedding · Due yesterday"
      />
      <FeedItem
        icon={InboxIcon}
        emphasis
        href="#"
        title="Answer 2 messages"
        meta="#1039 Kick-off · Due today"
      />
      <FeedItem
        icon={HandCoinsIcon}
        emphasis
        href="#"
        title="Follow up 4 000 kr overdue"
        meta="#1031 Seminar · Due in 3 days"
      />
    </div>
  ),
};
