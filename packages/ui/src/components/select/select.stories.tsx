import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const meta = { title: "Components/Select", component: Select } satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Välj uppställning" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="theatre">Teater</SelectItem>
        <SelectItem value="classroom">Klassrum</SelectItem>
        <SelectItem value="banquet">Bankett</SelectItem>
      </SelectContent>
    </Select>
  ),
};
