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
        <Button variant="outline">Öppna dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bekräfta bokning</DialogTitle>
          <DialogDescription>Kontrollera uppgifterna innan du fortsätter.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button>Bekräfta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
