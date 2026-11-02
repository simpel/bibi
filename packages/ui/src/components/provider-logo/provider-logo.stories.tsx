import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import { FortnoxLogo, StripeLogo } from "./provider-logo";

const meta = {
  title: "Components/ProviderLogo",
  component: StripeLogo,
} satisfies Meta<typeof StripeLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Logos: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <StripeLogo className="h-8" />
      <FortnoxLogo className="size-8" />
    </div>
  ),
};

export const BrandButtons: Story = {
  render: () => (
    <div className="flex gap-3">
      <Button variant="stripe">Connect to Stripe</Button>
      <Button variant="fortnox">
        <FortnoxLogo className="text-brand-fortnox-foreground" /> Connect Fortnox
      </Button>
    </div>
  ),
};
