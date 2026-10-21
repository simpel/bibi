import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta = { title: "Components/Dialog", component: Dialog } satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Visa bokningsdetaljer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm ticket</DialogTitle>
          <DialogDescription>Check the details before you continue.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button>Bekräfta bokning</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
