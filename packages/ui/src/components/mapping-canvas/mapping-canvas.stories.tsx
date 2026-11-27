import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { MappingCanvas, type MappingCanvasProps } from "./mapping-canvas";
import type { MappingAccount, MappingPurpose } from "./mapping-types";

const labels: MappingCanvasProps["labels"] = {
  purposes: "What Bibi books",
  accounts: "Accounts",
  required: "Required",
  inactive: "Inactive",
  addAccount: "Add account",
  searchAccounts: "Search accounts",
  noAccountFound: "No account found",
  chooseAccount: "Choose account",
  removeLine: "Remove line",
  unmapped: "Not mapped",
};

type StatefulProps = Omit<MappingCanvasProps, "onConnect" | "onDisconnect" | "labels">;

function Stateful({ purposes: initial, ...rest }: StatefulProps) {
  const [purposes, setPurposes] = useState<MappingPurpose[]>(initial);
  const set = ({ purposeId, accountId }: { purposeId: string; accountId: string | null }) =>
    setPurposes((current) =>
      current.map((purpose) =>
        purpose.id === purposeId
          ? {
              ...purpose,
              accountId,
              state: accountId ? "ok" : "unmapped",
              stateText: undefined,
            }
          : purpose,
      ),
    );
  return (
    <MappingCanvas
      {...rest}
      purposes={purposes}
      labels={labels}
      onConnect={set}
      onDisconnect={({ purposeId }) => set({ purposeId, accountId: null })}
    />
  );
}

const fortnoxAccounts: MappingAccount[] = [
  { id: "3001", label: "3001 Försäljning varor 25 % moms" },
  { id: "3041", label: "3041 Tjänster 25 % moms" },
  { id: "3051", label: "3051 Försäljning mat 12 % moms" },
  { id: "3052", label: "3052 Försäljning dryck 25 % moms" },
  ...Array.from({ length: 40 }, (_, index) => ({
    id: `31${index}`,
    label: `31${String(index).padStart(2, "0")} Övriga intäkter`,
  })),
];

const purposes: MappingPurpose[] = [
  {
    id: "room",
    label: "Rooms",
    hint: "Used when an item type has no own account",
    required: true,
    accountId: "3041",
    state: "ok",
  },
  { id: "food", label: "Food", required: true, accountId: null, state: "unmapped" },
  { id: "drink", label: "Drinks", accountId: null, state: "unmapped" },
  { id: "deposit", label: "Deposits", accountId: null, state: "unmapped" },
];

const meta = {
  title: "Components/MappingCanvas",
  component: MappingCanvas,
} satisfies Meta<typeof MappingCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;
const noop = () => undefined;
const base = { labels, onConnect: noop, onDisconnect: noop };

export const Fortnox: Story = {
  args: { ...base, purposes, accounts: fortnoxAccounts },
  render: (args) => <Stateful purposes={args.purposes} accounts={args.accounts} />,
};

const spirisAccounts: MappingAccount[] = [
  { id: "s1", label: "Services", detail: "25 %, 12 %, 6 %" },
  { id: "s2", label: "Goods", detail: "25 %" },
  { id: "s3", label: "Food and drink", detail: "12 %" },
  { id: "s4", label: "Exempt", detail: "0 %" },
];

export const Spiris: Story = {
  args: { ...base, purposes, accounts: spirisAccounts },
  render: (args) => <Stateful purposes={args.purposes} accounts={args.accounts} />,
};

export const AttentionAndInactive: Story = {
  args: { ...base, purposes, accounts: fortnoxAccounts },
  render: () => (
    <Stateful
      accounts={[{ id: "old", label: "3099 Old account", inactive: true }, ...fortnoxAccounts]}
      purposes={[
        {
          ...(purposes[0] as MappingPurpose),
          accountId: "old",
          state: "attention",
          stateText: "The account is no longer active",
        },
        {
          ...(purposes[1] as MappingPurpose),
          accountId: "3051",
          state: "attention",
          stateText: "The VAT rate does not match",
        },
        { ...(purposes[2] as MappingPurpose), accountId: "3051", state: "ok" },
        purposes[3] as MappingPurpose,
      ]}
    />
  ),
};

export const Disabled: Story = {
  args: { ...base, purposes, accounts: fortnoxAccounts, disabled: true },
  render: () => (
    <Stateful
      disabled
      accounts={fortnoxAccounts}
      purposes={[
        { ...(purposes[0] as MappingPurpose) },
        { ...(purposes[1] as MappingPurpose), accountId: "3051", state: "ok" },
      ]}
    />
  ),
};
