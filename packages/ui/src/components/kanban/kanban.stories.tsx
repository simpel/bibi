import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { NumberFlow } from "../hero-number/hero-number";
import { KanbanBoard } from "./kanban-board";
import type { KanbanCardData, KanbanLabels } from "./kanban-types";

type StoryCard = KanbanCardData & { subtitle: string; value: number };

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
  { id: "1", columnId: "new", title: "Annual meeting", subtitle: "Nordkust AB", value: 48_000 },
  {
    id: "2",
    columnId: "qualified",
    title: "Product launch",
    subtitle: "Vingaleden",
    value: 125_500,
  },
  {
    id: "3",
    columnId: "confirmed",
    zoneId: "confirmed",
    title: "Board dinner",
    subtitle: "Lindholmen",
    value: 32_750,
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
        renderSummary={({ cards: lane }) => (
          <NumberFlow
            value={lane.reduce((sum, card) => sum + card.value, 0)}
            locales="sv-SE"
            suffix=" kr"
          />
        )}
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
 * (Confirmed, Final count locked): dragging a card over it shows one target per zone. Each lane's
 * count and total value animate as a card moves.
 */
export const Default: Story = {};
