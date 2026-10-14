import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

const meta = { title: "Components/Table", component: Table } satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Table className="w-[28rem]">
      <TableHeader>
        <TableRow>
          <TableHead>Rum</TableHead>
          <TableHead>Platser</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Stora salen</TableCell>
          <TableCell>120</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Biblioteket</TableCell>
          <TableCell>16</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
