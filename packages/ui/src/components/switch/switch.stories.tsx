import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "../label/label";
import { Switch } from "./switch";

const meta = {
  title: "Components/Switch",
  component: Switch,
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch id="switch-demo" {...args} />
      <Label htmlFor="switch-demo">Aktivera notifieringar</Label>
    </div>
  ),
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
