import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Combobox, type ComboboxProps } from "./combobox";

const options: ComboboxProps["options"] = Array.from({ length: 300 }, (_, index) => ({
  value: `room-${index}`,
  label: `Room ${index + 1}`,
  description: index % 3 === 0 ? "With projector" : undefined,
  group: `Floor ${Math.floor(index / 50) + 1}`,
}));

const meta = { title: "Components/Combobox", component: Combobox } satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const [value, setValue] = useState<string>();
  return (
    <div className="w-72">
      <Combobox
        options={options}
        value={value}
        onValueChange={setValue}
        placeholder="Select room"
        searchPlaceholder="Search rooms"
        emptyText="No rooms found"
      />
    </div>
  );
}

export const Default: Story = {
  args: {
    options,
    onValueChange: () => {},
    placeholder: "Select room",
    searchPlaceholder: "Search rooms",
    emptyText: "No rooms found",
  },
  render: () => <Demo />,
};
