import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const meta = { title: "Components/Select", component: Select } satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select setup" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="theatre">Theatre</SelectItem>
        <SelectItem value="classroom">Classroom</SelectItem>
        <SelectItem value="banquet">Banquet</SelectItem>
      </SelectContent>
    </Select>
  ),
};
