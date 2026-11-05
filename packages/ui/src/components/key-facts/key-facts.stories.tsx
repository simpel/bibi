import type { Meta, StoryObj } from "@storybook/react-vite";
import { KeyFacts } from "./key-facts";

const meta = {
  title: "Components/KeyFacts",
  component: KeyFacts,
  args: {
    facts: [
      { label: "Customer", value: "Kvarnby Design AB", truncate: true },
      { label: "Contact person", value: "Linnea Kvist" },
      {
        label: "Desired dates",
        preheader: "Thu 5 Nov 2026",
        value: "09:00 – 17:00",
      },
      { label: "Estimated headcount", value: "16" },
    ],
  },
} satisfies Meta<typeof KeyFacts>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The page's primary facts under the title: the label sits under each value. */
export const Large: Story = { args: { size: "lg" } };

/** The same facts in a card or popover, e.g. the pinned booking. */
export const Small: Story = {
  args: {
    size: "sm",
    className: "w-96 border-y border-border/60 py-2",
    facts: [
      { label: "Value", value: "11 200,00 kr" },
      { label: "Guests", value: "16" },
      { label: "When", preheader: "Thu 5 Nov 2026", value: "13:00–17:00" },
      { label: "Where", value: "Donsö", truncate: true },
    ],
  },
};

/** A fact with a preheader leaves a line above every value, so they share a baseline. */
export const WithPreheader: Story = {
  args: {
    size: "lg",
    facts: [
      { label: "Value", value: "11 200,00 kr" },
      { label: "When", preheader: "Thu 5 Nov 2026", value: "13:00–17:00" },
    ],
  },
};

/** Values with `onSelect` are buttons, e.g. to open the order. */
export const Clickable: Story = {
  args: {
    size: "sm",
    facts: [
      { label: "Value", value: "11 200,00 kr", onSelect: () => {} },
      { label: "Guests", value: "16", onSelect: () => {} },
      { label: "Where", value: "Donsö", onSelect: () => {} },
    ],
  },
};

/** A long value cuts short instead of wrapping, and gives way before the others. */
export const Truncated: Story = {
  args: {
    size: "lg",
    className: "w-[34rem]",
    facts: [
      {
        label: "Customer",
        value: "Hisingen Energi och Fastighetsutveckling Aktiebolag",
        truncate: true,
        title: "Hisingen Energi och Fastighetsutveckling Aktiebolag",
      },
      { label: "Guests", value: "42" },
    ],
  },
};
