import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import { Toaster, toast } from "./toast";

const meta = { title: "Components/Toast", component: Toaster } satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <>
      <Toaster />
      <Button onClick={() => toast.success("Room saved")}>Show toast</Button>
    </>
  ),
};
