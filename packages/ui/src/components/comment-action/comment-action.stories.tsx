import type { Meta, StoryObj } from "@storybook/react-vite";
import { CommentAction } from "./comment-action";

const meta = {
  title: "Components/CommentAction",
  component: CommentAction,
  args: { label: "Comments", count: 0, onClick: () => undefined },
} satisfies Meta<typeof CommentAction>;

export default meta;

type Story = StoryObj<typeof meta>;

/** No comments yet: the icon alone. */
export const Empty: Story = {};

/** Three comments, all read. */
export const WithCount: Story = { args: { count: 3, label: "Comments (3)" } };

/** Beside other title-row buttons: an outline icon button with the dot, no count. */
export const IconButton: Story = {
  args: { count: 3, unread: true, look: "icon", label: "Comments (3, 1 new)" },
};

/** One of them is new to the viewer: the red dot. */
export const Unread: Story = { args: { count: 3, unread: true, label: "Comments (3, 1 new)" } };
