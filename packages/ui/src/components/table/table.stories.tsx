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
          <TableHead>Rooms</TableHead>
          <TableHead>Seats</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Great hall</TableCell>
          <TableCell>120</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>The library</TableCell>
          <TableCell>16</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
