import type { Meta, StoryObj } from "@storybook/react-vite";
import { BookableDisplay } from "./bookable-display";
import { BundleDisplay } from "./bundle-display";
import { CustomisationsDisplay } from "./customisations-display";
import { PricedDisplay } from "./priced-display";
import { SetupsDisplay } from "./setups-display";

const meta = { title: "Components/CapabilityDisplay" } satisfies Meta;

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

export const Bundle: Story = {
  render: () => <BundleDisplay title="Parts" parts={["2 × Coffee", "1 × Sandwich"]} />,
};

export const Customisations: Story = {
  render: () => (
    <CustomisationsDisplay
      title="Customisations"
      groups={["Main course: pick 1"]}
      density="comfortable"
    />
  ),
};
