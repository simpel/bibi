import { ArrowUpRightIcon } from "lucide-react";
import { Badge } from "../../components/badge/badge";
import { Button } from "../../components/button/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/card/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/table/table";
import { upcomingTickets } from "./dashboard-data";

function TicketRow({ ticket }: { ticket: (typeof upcomingTickets)[number] }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{ticket.name}</span>
          <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{ticket.customer}</TableCell>
      <TableCell>
        <Badge variant="outline" className="font-normal text-xs">
          {ticket.venue}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">{ticket.dates}</TableCell>
      <TableCell className="text-right font-mono font-medium text-xs">{ticket.guests}</TableCell>
      <TableCell>
        <Badge variant={ticket.badgeVariant} className="text-[10px]">
          {ticket.phase}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

export function DashboardTicketsTable() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Upcoming Event Tickets</CardTitle>
          <CardDescription>
            Scheduled conferences, banquets, and active pipeline items
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 text-xs">
          <span>View all tickets</span>
          <ArrowUpRightIcon className="size-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event & Ticket</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Assigned Space</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Guests</TableHead>
              <TableHead>Phase</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upcomingTickets.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
