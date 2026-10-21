import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { HeroNumber } from "./hero-number";

const meta = {
  title: "Components/HeroNumber",
  component: HeroNumber,
  args: {
    value: 184500,
    label: "Totalbelopp",
    suffix: " SEK",
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof HeroNumber>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveFinancialDemo() {
  const [amount, setAmount] = useState(184500);

  return (
    <div className="flex w-[32rem] max-w-full flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm font-sans">
      <HeroNumber
        value={amount}
        label="Totalbelopp offert (exkl. moms)"
        suffix=" SEK"
        statusBadge="✓ Bekräftad"
        size="xl"
      />

      <div className="flex flex-col gap-2 border-t pt-4">
        <span className="text-xs text-muted-foreground">
          Justera belopp (Number Flow transition):
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAmount((v) => v + 12500)}
            className="rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            +12 500 SEK (Tillägg F&B)
          </button>
          <button
            type="button"
            onClick={() => setAmount((v) => Math.max(0, v - 15000))}
            className="rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            -15 000 SEK (Rabatt)
          </button>
          <button
            type="button"
            onClick={() => setAmount(248000)}
            className="rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Sätt till 248 000 SEK
          </button>
          <button
            type="button"
            onClick={() => setAmount(184500)}
            className="rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Återställ
          </button>
        </div>
      </div>
    </div>
  );
}

function InteractiveCapacityDemo() {
  const [guests, setGuests] = useState(240);

  return (
    <div className="flex w-[28rem] max-w-full flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm font-sans">
      <HeroNumber value={guests} label="Bekräftat antal deltagare" suffix=" gäster" size="lg" />

      <div className="flex items-center gap-2 border-t pt-4">
        <button
          type="button"
          onClick={() => setGuests((g) => Math.max(1, g - 10))}
          className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
        >
          -10 gäster
        </button>
        <button
          type="button"
          onClick={() => setGuests((g) => g + 10)}
          className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
        >
          +10 gäster
        </button>
        <button
          type="button"
          onClick={() => setGuests((g) => g + 50)}
          className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
        >
          +50 gäster
        </button>
      </div>
    </div>
  );
}

export const FinancialQuotation: Story = {
  render: () => <InteractiveFinancialDemo />,
};

export const GuestCapacity: Story = {
  render: () => <InteractiveCapacityDemo />,
};
