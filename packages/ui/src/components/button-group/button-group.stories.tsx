import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchIcon } from "lucide-react";
import { Button } from "../button/button";
import { Input } from "../input/input";
import { ButtonGroup } from "./button-group";

const meta = {
  title: "Components/ButtonGroup",
  component: ButtonGroup,
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InputWithButton: Story = {
  render: () => (
    <ButtonGroup className="w-96">
      <Input placeholder="Search" />
      <Button variant="outline" size="icon" aria-label="Search">
        <SearchIcon />
      </Button>
    </ButtonGroup>
  ),
};
