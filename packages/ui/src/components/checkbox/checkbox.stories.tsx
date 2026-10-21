import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "../label/label";
import { Checkbox } from "./checkbox";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox id="checkbox-demo" {...args} />
      <Label htmlFor="checkbox-demo">Acceptera bokningsvillkor</Label>
    </div>
  ),
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
