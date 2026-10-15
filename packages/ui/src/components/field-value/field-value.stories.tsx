import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldValue } from "./field-value";

const meta = {
  title: "Components/FieldValue",
  component: FieldValue,
  args: { kind: "TEXT", value: "Daylight" },
} satisfies Meta<typeof FieldValue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {};
export const NumberValue: Story = { args: { kind: "NUMBER", value: "42" } };
export const YesNo: Story = { args: { kind: "BOOLEAN", value: "Yes" } };
export const DateValue: Story = { args: { kind: "DATE", value: "2026-10-15" } };
export const Choice: Story = { args: { kind: "CHOICE", value: "Cinema" } };
export const MultiChoice: Story = {
  args: { kind: "MULTI_CHOICE", value: ["Gluten", "Lactose", "Nuts"] },
};
export const Empty: Story = { args: { value: null } };
