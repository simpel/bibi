import type { Meta, StoryObj } from "@storybook/react-vite";
import { QrCode } from "./qr-code";

/** A hand-drawn 21 × 21 sample (finder patterns and timing only); apps pass an encoder's output. */
const SAMPLE = Array.from({ length: 21 }, (_, y) =>
  Array.from({ length: 21 }, (_, x) => {
    const finder = (cx: number, cy: number) => {
      const d = Math.max(Math.abs(x - cx), Math.abs(y - cy));
      return d <= 3 && d !== 2;
    };
    return (
      finder(3, 3) || finder(17, 3) || finder(3, 17) || ((x === 6 || y === 6) && (x + y) % 2 === 0)
    );
  }),
);

const meta = {
  title: "Components/QrCode",
  component: QrCode,
  args: { modules: SAMPLE, label: "Scan to pay" },
} satisfies Meta<typeof QrCode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { className: "size-32" } };
