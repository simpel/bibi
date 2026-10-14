import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "../input/input";
import { FormField } from "./form-field";

const meta = {
  title: "Components/FormField",
  component: FormField,
  args: { id: "venue-name", label: "Name", children: null },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <FormField {...args} description="Shown to guests." required>
      <Input id={args.id} />
    </FormField>
  ),
};

export const WithError: Story = {
  render: (args) => (
    <FormField {...args} error="Name is required">
      <Input id={args.id} aria-invalid />
    </FormField>
  ),
};
