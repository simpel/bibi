import type { Meta, StoryObj } from "@storybook/react-vite";
import { BookableDisplay } from "./bookable-display";
import { BundleDisplay } from "./bundle-display";
import { CustomisationsDisplay } from "./customisations-display";
import { PricedDisplay } from "./priced-display";
import { SetupsDisplay } from "./setups-display";

const meta = {
  title: "Components/CapabilityDisplay",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Priced: Story = {
  render: () => (
    <div className="w-[320px]">
      <PricedDisplay title="Price" price="250 kr per person" vat="12 %" vatLabel="VAT" />
    </div>
  ),
};

export const PricedNoVat: Story = {
  name: "Priced (No VAT)",
  render: () => (
    <div className="w-[320px]">
      <PricedDisplay title="Price" price="1 500 SEK / day" />
    </div>
  ),
};

export const PricedPlain: Story = {
  name: "Priced (Plain Variant)",
  render: () => (
    <div className="w-[320px] rounded-lg border border-dashed border-border p-4">
      <PricedDisplay
        title="Price"
        price="250 kr per person"
        vat="12 %"
        vatLabel="VAT"
        variant="plain"
      />
    </div>
  ),
};

export const Bookable: Story = {
  render: () => (
    <div className="w-[320px]">
      <BookableDisplay title="Booking" duration="90 min" />
    </div>
  ),
};

export const Setups: Story = {
  render: () => (
    <div className="w-[320px]">
      <SetupsDisplay
        title="Setups"
        setups={[
          { name: "Cinema", capacity: "80" },
          { name: "U-table", capacity: "24" },
          { name: "Boardroom", capacity: "16" },
        ]}
      />
    </div>
  ),
};

export const Bundle: Story = {
  render: () => (
    <div className="w-[320px]">
      <BundleDisplay title="Parts" parts={["2 × Coffee", "1 × Sandwich", "1 × Mineral water"]} />
    </div>
  ),
};

export const Customisations: Story = {
  render: () => (
    <div className="w-[320px]">
      <CustomisationsDisplay
        title="Customisations"
        groups={["Main course: pick 1", "Drink: pick 1"]}
      />
    </div>
  ),
};

export const GridOverview: Story = {
  name: "Grid Overview (Item Detail)",
  render: () => (
    <div className="w-[680px] grid gap-4 sm:grid-cols-2">
      <PricedDisplay title="Price" price="250 kr per person" vat="12 %" vatLabel="VAT" />
      <BookableDisplay title="Booking" duration="90 min" />
      <SetupsDisplay
        title="Setups"
        setups={[
          { name: "Cinema", capacity: "80" },
          { name: "U-table", capacity: "24" },
        ]}
      />
      <BundleDisplay title="Parts" parts={["2 × Coffee", "1 × Sandwich"]} />
      <CustomisationsDisplay
        title="Customisations"
        groups={["Main course: pick 1"]}
        className="sm:col-span-2"
      />
    </div>
  ),
};
