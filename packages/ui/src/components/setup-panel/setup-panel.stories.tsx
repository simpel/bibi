import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../button/button";
import { SetupPanel, type SetupPanelLabels, type SetupPanelProps } from "./setup-panel";
import type { SetupTarget } from "./setup-selection";

const labels: SetupPanelLabels = {
  empty: "Your first version appears here as we talk",
  note: "A starting point. You can change anything later.",
  unsaved: "Nothing is saved yet",
  sell: "What you sell",
  path: "How a request moves",
  hint: "Click a status or something you sell to tell me what to change.",
};

const meta = { title: "Components/SetupPanel", component: SetupPanel } satisfies Meta<
  typeof SetupPanel
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { itemTypes: null, statuses: [], labels } };

export const Draft: Story = {
  args: {
    itemTypes: ["Conference room", "Lunch", "Activity"],
    statuses: [
      { name: "Request", color: "#3b82f6" },
      { name: "Quote sent", color: "#f59e0b" },
      { name: "Confirmed", color: "#22c55e" },
      { name: "Lost", color: "#ef4444" },
    ],
    labels,
  },
};

function SelectableDraft({ initial }: { initial: SetupTarget | null }) {
  const [selected, setSelected] = useState<SetupTarget | null>(initial);
  return (
    <SetupPanel
      {...(Draft.args as SetupPanelProps)}
      selection={{
        selected,
        onSelect: ({ target }) => setSelected(target),
        renderComment: ({ target, close }) => (
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium">
              {target.kind === "status" ? "Status" : "Item type"}: {target.name}
            </span>
            <Button type="button" size="sm" variant="ghost" onClick={close}>
              Cancel
            </Button>
          </div>
        ),
      }}
    />
  );
}

/** Click (or Enter on) a status or item type to open its comment box. */
export const Selectable: Story = {
  args: Draft.args,
  render: () => <SelectableDraft initial={null} />,
};

/** The selected state: the status is outlined and its comment box is open. */
export const Selected: Story = {
  args: Draft.args,
  render: () => <SelectableDraft initial={{ kind: "status", name: "Quote sent" }} />,
};
