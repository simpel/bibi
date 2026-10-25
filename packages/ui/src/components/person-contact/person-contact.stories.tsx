import type { Meta, StoryObj } from "@storybook/react-vite";
import { PersonContact } from "./person-contact";

const meta = {
  title: "Components/PersonContact",
  component: PersonContact,
  args: { name: "Johan Ek", description: "Coordinator", phone: "+46 70 555 01 12" },
  decorators: [(Story) => <div className="w-72">{Story()}</div>],
} satisfies Meta<typeof PersonContact>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithEmail: Story = { args: { email: "johan.ek@example.com" } };
export const Compact: Story = { args: { size: "compact" } };
export const WithoutAvatar: Story = {
  args: { avatar: false, name: "Anna Karlsson", description: "Volvo Cars" },
};
export const Mini: Story = { args: { size: "mini", name: "Mona Berg", description: "Waiter" } };
export const NameOnly: Story = { args: { description: undefined, phone: undefined } };
export const Inherited: Story = {
  args: { name: "Erik Lund", description: "Ticket assignee, from ticket", phone: undefined },
};
