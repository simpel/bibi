import type { Meta, StoryObj } from "@storybook/react-vite";
import { FloorDrawing, type FloorDrawingElement } from "./floor-drawing";

const around = ({ count, radius }: { count: number; radius: number }) =>
  Array.from({ length: count }, (_, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI / 2;
    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      rotationDeg: (angle * 180) / Math.PI - 90,
    };
  });

const base = { rotationDeg: 0, label: null, fixed: false, keepClearCm: null, seats: [] };

const elements: FloorDrawingElement[] = [
  {
    ...base,
    id: "a",
    name: "Round table 1",
    shape: "ROUND",
    xCm: 300,
    yCm: 300,
    widthCm: 180,
    depthCm: 180,
    label: "1",
    seats: around({ count: 10, radius: 118 }),
  },
  {
    ...base,
    id: "b",
    name: "Table",
    shape: "RECT",
    xCm: 700,
    yCm: 300,
    widthCm: 180,
    depthCm: 80,
    tone: "selected",
    seats: [-60, 0, 60].map((x) => ({ x, y: 68, rotationDeg: 0 })),
  },
  {
    ...base,
    id: "c",
    name: "Stage",
    shape: "RECT",
    xCm: 700,
    yCm: 620,
    widthCm: 400,
    depthCm: 200,
    tone: "warning",
  },
];

const fixed: FloorDrawingElement[] = [
  {
    ...base,
    id: "d",
    name: "Door",
    shape: "RECT",
    xCm: 120,
    yCm: 790,
    rotationDeg: 180,
    widthCm: 100,
    depthCm: 20,
    fixed: true,
    keepClearCm: 140,
  },
];

const meta = {
  title: "Components/FloorDrawing",
  component: FloorDrawing,
  args: {
    widthCm: 1000,
    depthCm: 800,
    outline: [
      [0, 0],
      [1000, 0],
      [1000, 800],
      [0, 800],
    ],
    elements,
    fixed,
    widthLabel: "10 m",
    title: "Banquet in the Garden room",
    className: "w-[640px]",
  },
} satisfies Meta<typeof FloorDrawing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
