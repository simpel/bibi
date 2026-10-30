import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { KanbanBoard } from "./kanban-board";
import type { KanbanCardData, KanbanLabels } from "./kanban-types";

type StoryCard = KanbanCardData & { subtitle: string };

const labels: KanbanLabels = {
  dragInstructions: "Press space to lift the card, arrow keys to move it, space to drop.",
  emptyColumn: "Nothing here",
  pickedUp: (card) => `Picked up ${card}`,
  movedOver: (card, column) => `${card} is over ${column}`,
  dropped: (card, column) => `${card} dropped in ${column}`,
  cancelled: (card) => `Moving ${card} cancelled`,
};

const columns = [
  { id: "new", title: "New" },
  { id: "qualified", title: "Qualified" },
  {
    id: "confirmed",
    title: "Won",
    zones: [
      { id: "confirmed", title: "Confirmed" },
      { id: "locked", title: "Final count locked" },
    ],
  },
  { id: "completed", title: "Completed" },
];

const initial: StoryCard[] = [
  { id: "1", columnId: "new", title: "Annual meeting", subtitle: "Nordkust AB" },
  { id: "2", columnId: "qualified", title: "Product launch", subtitle: "Vingaleden" },
  {
    id: "3",
    columnId: "confirmed",
    zoneId: "confirmed",
    title: "Board dinner",
    subtitle: "Lindholmen",
  },
];

function Demo() {
  const [cards, setCards] = useState(initial);
  return (
    <div className="h-96">
      <KanbanBoard
        columns={columns}
        cards={cards}
        labels={labels}
        canDrop={({ toColumnId }) => toColumnId !== "completed"}
        onMove={({ cardId, toColumnId, toZoneId }) =>
          setCards((all) =>
            all.map((c) =>
              c.id === cardId ? { ...c, columnId: toColumnId, zoneId: toZoneId } : c,
            ),
          )
        }
        renderCard={(card) => (
          <div className="grid gap-0.5">
            <span className="text-sm font-medium">{card.title}</span>
            <span className="text-xs text-muted-foreground">{card.subtitle}</span>
          </div>
        )}
      />
    </div>
  );
}

const meta = { title: "Components/Kanban", component: Demo } satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Completed refuses drops: it stays un-highlighted while a card is dragged. Won has two zones
 * (Confirmed, Final count locked): dragging a card over it shows one target per zone.
 */
export const Default: Story = {};
