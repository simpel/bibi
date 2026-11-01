import type { Meta, StoryObj } from "@storybook/react-vite";
import { DownloadIcon, PlusIcon } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../card/card";
import { HeaderActions } from "./header-actions";

const meta = {
  title: "Components/HeaderActions",
  component: HeaderActions,
  args: { moreLabel: "Actions", actions: [] },
} satisfies Meta<typeof HeaderActions>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => undefined;

const inCard = (args: Story["args"]) => (
  <Card className="max-w-2xl">
    <CardHeader>
      <CardTitle>Connected apps</CardTitle>
      <CardDescription>Apps you have given access to Bibi.</CardDescription>
      <CardAction>
        <HeaderActions moreLabel="Actions" actions={args?.actions ?? []} />
      </CardAction>
    </CardHeader>
    <CardContent>Content</CardContent>
  </Card>
);

/** One action with one choice: a plain button (no menu), right of the title or under it on small screens. */
export const OneAction: Story = {
  args: {
    actions: [
      {
        id: "add",
        label: "Add connection",
        icon: <PlusIcon />,
        items: [{ id: "claude", label: "Claude", onSelect: noop }],
      },
    ],
  },
  render: inCard,
};

/** Several actions: side by side on wide screens, one menu with submenus on small ones. */
export const SeveralActions: Story = {
  args: {
    actions: [
      {
        id: "add",
        label: "Add connection",
        icon: <PlusIcon />,
        items: [
          { id: "claude", label: "Claude", onSelect: noop },
          { id: "other", label: "Other app", onSelect: noop },
        ],
      },
      { id: "export", label: "Export", icon: <DownloadIcon />, onSelect: noop },
    ],
  },
  render: inCard,
};
