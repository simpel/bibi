import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const meta = {
  title: "Components/DropdownMenu",
  component: DropdownMenu,
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Åtgärder</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Rum</DropdownMenuLabel>
        <DropdownMenuItem>Redigera</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive>Ta bort</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
