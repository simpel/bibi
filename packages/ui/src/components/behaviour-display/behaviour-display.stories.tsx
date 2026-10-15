import type { Meta, StoryObj } from "@storybook/react-vite";
import { BookableDisplay } from "./bookable-display";
import { ChoicesDisplay } from "./choices-display";
import { ComposableDisplay } from "./composable-display";
import { PricedDisplay } from "./priced-display";
import { SetupsDisplay } from "./setups-display";

const meta = { title: "Components/BehaviourDisplay" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Priced: Story = {
  render: () => <PricedDisplay title="Price" price="250 kr per person" vat="12 %" vatLabel="VAT" />,
};

export const Bookable: Story = {
  render: () => <BookableDisplay title="Booking" duration="90 min" />,
};

export const Setups: Story = {
  render: () => (
    <SetupsDisplay
      title="Setups"
      setups={[
        { name: "Cinema", capacity: "80" },
        { name: "U-table", capacity: "24" },
      ]}
    />
  ),
};

export const Composable: Story = {
  render: () => <ComposableDisplay title="Parts" parts={["2 × Coffee", "1 × Sandwich"]} />,
};

export const Choices: Story = {
  render: () => (
    <ChoicesDisplay title="Choices" groups={["Main course: pick 1"]} density="comfortable" />
  ),
};
