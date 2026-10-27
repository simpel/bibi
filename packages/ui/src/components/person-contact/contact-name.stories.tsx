import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContactName } from "./contact-name";

const meta = {
  title: "Components/ContactName",
  component: ContactName,
  args: {
    contact: {
      name: "Johan Ek",
      description: "Coordinator",
      phone: "+46 70 555 01 12",
      email: "johan.ek@example.com",
    },
  },
  parameters: { layout: "centered" },
} satisfies Meta<typeof ContactName>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Point at the name or click it for the card. */
export const Default: Story = {};

/** A client's contact: no profile, so no avatar. */
export const Client: Story = {
  args: {
    contact: {
      name: "Anna Karlsson",
      description: "Volvo Cars",
      email: "anna.karlsson@example.com",
      avatar: false,
    },
  },
};

/** A long address is cut short in the card, never past its edge. */
export const LongEmail: Story = {
  args: {
    contact: {
      name: "Erik Lund",
      description: "Ticket assignee",
      phone: "+46 70 100 00 02",
      email: "erik.lund@lindholmen-demo.bibi.test",
    },
  },
};
