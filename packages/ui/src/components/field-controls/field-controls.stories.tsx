import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { BooleanControl } from "./boolean-control";
import { ChoiceControl } from "./choice-control";
import { DateControl } from "./date-control";
import { LinkControl } from "./link-control";
import { MultiChoiceControl } from "./multi-choice-control";
import { NumberControl } from "./number-control";
import { TextControl } from "./text-control";

const choices = [
  { value: "a", label: "Cinema" },
  { value: "b", label: "U-table" },
  { value: "c", label: "Mingle" },
];

const meta = { title: "Components/FieldControls" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  render: () => {
    const [value, setValue] = useState("Hello");
    return <TextControl value={value} onChange={setValue} />;
  },
};

export const NumberField: Story = {
  render: () => {
    const [value, setValue] = useState("12.5");
    return <NumberControl value={value} onChange={setValue} />;
  },
};

export const DateField: Story = {
  render: () => {
    const [value, setValue] = useState("2026-10-15");
    return <DateControl value={value} onChange={setValue} />;
  },
};

export const YesNo: Story = {
  render: () => {
    const [value, setValue] = useState(true);
    return <BooleanControl value={value} onChange={setValue} />;
  },
};

export const Choice: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <ChoiceControl value={value} onChange={setValue} choices={choices} placeholder="Select…" />
    );
  },
};

export const MultiChoice: Story = {
  render: () => {
    const [value, setValue] = useState(["a"]);
    return <MultiChoiceControl id="setups" value={value} onChange={setValue} choices={choices} />;
  },
};

export const MultiChoiceEmpty: Story = {
  render: () => (
    <MultiChoiceControl
      id="none"
      value={[]}
      onChange={() => {}}
      choices={[]}
      emptyLabel="No options."
    />
  ),
};

export const Link: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <LinkControl
        value={value}
        onChange={setValue}
        choices={choices}
        placeholder="Select…"
        searchPlaceholder="Search…"
        emptyText="No matches."
      />
    );
  },
};
