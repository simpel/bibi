import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../button/button";
import { KanbanColumnFace } from "./kanban-column";
import { KanbanCustomizeBoard } from "./kanban-customize-board";
import type {
  KanbanCustomizeLabels,
  KanbanCustomizeSlots,
  KanbanPhaseData,
} from "./kanban-customize-types";

const labels: KanbanCustomizeLabels = {
  dragInstructions: "Press space to lift, the arrow keys to move and space to drop.",
  unphased: "Not on this board",
  unphasedEmpty: "Every status is on the board",
  emptyPhase: "Drag a status here",
  phaseHandle: (phase) => `Move column ${phase}`,
  count: (count) => `${count} tickets`,
  pickedUp: (item) => `Picked up ${item}`,
  movedOver: (item, target) => `${item} is over ${target}`,
  dropped: (item, target) => `${item} dropped in ${target}`,
  cancelled: (item) => `Moving ${item} cancelled`,
};

const statuses = [
  { id: "lead", title: "Lead", color: "#f59e0b", count: 4 },
  { id: "quote", title: "Quote sent", color: "#3b82f6", count: 2 },
  { id: "confirmed", title: "Confirmed", color: "#22c55e", count: 3 },
  { id: "locked", title: "Final count locked", color: "#16a34a", count: 1 },
  { id: "completed", title: "Completed", color: "#64748b" },
  { id: "lost", title: "Lost", color: "#ef4444" },
];

const initial: KanbanPhaseData[] = [
  { id: "p1", title: "Lead", statusIds: ["lead"] },
  { id: "p2", title: "Quote sent", statusIds: ["quote"] },
  { id: "p3", title: "Won", statusIds: ["confirmed", "locked"] },
  { id: "p4", title: "Closed", statusIds: ["completed"] },
];

const slots: KanbanCustomizeSlots = {
  renderFront: ({ phase }) => (
    <KanbanColumnFace column={phase} count={0} emptyLabel="Nothing here" />
  ),
  renderPhaseHeader: ({ phase }) => <span className="text-sm font-medium">{phase.title}</span>,
  renderAddColumn: ({ position }) => (
    <Button size="sm" variant="ghost" className="self-start" aria-label={`Add column ${position}`}>
      +
    </Button>
  ),
  unphasedFooter: (
    <Button size="sm" variant="ghost">
      + Add status
    </Button>
  ),
};

type MoveInput = { phases: KanbanPhaseData[]; statusId: string; toPhaseId: string | null };

const moveStatus = ({ phases, statusId, toPhaseId }: MoveInput) =>
  phases.map((p) => ({
    ...p,
    statusIds:
      p.id === toPhaseId ? [...p.statusIds, statusId] : p.statusIds.filter((id) => id !== statusId),
  }));

function Demo() {
  const [phases, setPhases] = useState(initial);
  const [flipped, setFlipped] = useState(true);
  return (
    <div className="grid h-[32rem] gap-3">
      <Button className="w-fit" variant="outline" onClick={() => setFlipped((on) => !on)}>
        {flipped ? "Done" : "Configure"}
      </Button>
      <KanbanCustomizeBoard
        phases={phases}
        statuses={statuses}
        flipped={flipped}
        labels={labels}
        onReorderPhases={({ ids }) =>
          setPhases((all) => ids.flatMap((id) => all.find((p) => p.id === id) ?? []))
        }
        onMoveStatus={(move) => setPhases((all) => moveStatus({ phases: all, ...move }))}
        slots={slots}
      />
    </div>
  );
}

const meta = {
  title: "Components/Kanban/Customize",
  component: Demo,
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Customize mode: columns flip to their back. Drag a column by its handle, drag status chips
 * between columns or into the "Not on this board" column on the far left, where Lost starts.
 */
export const Default: Story = {};
