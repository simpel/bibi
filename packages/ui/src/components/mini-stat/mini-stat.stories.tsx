import type { Meta, StoryObj } from "@storybook/react-vite";
import { MiniStat, MiniStatRow } from "./mini-stat";

const meta = { title: "Components/MiniStat", component: MiniStat } satisfies Meta<typeof MiniStat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Row: Story = {
  args: { label: "Value", value: "11 200 kr" },
  render: () => (
    <MiniStatRow className="w-80">
      <MiniStat label="Value" value="11 200 kr" />
      <MiniStat label="Qty" value="2" />
      <MiniStat label="Time" value="13:00–17:00" />
      <MiniStat label="Where" value="Donsö" />
    </MiniStatRow>
  ),
};
