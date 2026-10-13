import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";

const meta = { title: "Components/Command", component: Command } satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Command className="w-96 rounded-lg border shadow-md">
      <CommandInput placeholder="Skriv ett kommando eller sök..." />
      <CommandList>
        <CommandEmpty>Inga träffar.</CommandEmpty>
        <CommandGroup heading="Förslag">
          <CommandItem>Skapa anläggning</CommandItem>
          <CommandItem>Skapa rum</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};
