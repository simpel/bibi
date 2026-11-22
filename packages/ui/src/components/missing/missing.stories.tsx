import type { Meta, StoryObj } from "@storybook/react-vite";
import { MissingButton, MissingField, MissingMark } from "./missing";

const meta = { title: "Components/Missing", component: MissingMark } satisfies Meta<
  typeof MissingMark
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Mark: Story = {};

export const Button: Story = {
  render: () => <MissingButton>Pick Main course</MissingButton>,
};

export const Field: Story = {
  render: () => (
    <MissingField hint="No time yet: set when it starts and ends">
      <input className="h-9 rounded-md border px-3" placeholder="Starts" />
    </MissingField>
  ),
};
