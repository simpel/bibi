import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  DownloadIcon,
  PlusIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { Badge } from "../../components/badge/badge";
import { Button } from "../../components/button/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/card/card";
import { ChartContainer, chartSeriesColor } from "../../components/chart/chart";
import { HeroNumber } from "../../components/hero-number/hero-number";
import { PageContainer } from "../../components/page-container/page-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/table/table";

const weeklyOccupancyData = [
  { week: "W43 (Oct 20)", confirmed: 6, holds: 2 },
  { week: "W44 (Oct 27)", confirmed: 8, holds: 3 },
  { week: "W45 (Nov 03)", confirmed: 9, holds: 4 },
  { week: "W46 (Nov 10)", confirmed: 12, holds: 2 },
  { week: "W47 (Nov 17)", confirmed: 7, holds: 5 },
  { week: "W48 (Nov 24)", confirmed: 10, holds: 1 },
];

const upcomingTickets = [
  {
    id: "TCK-801",
    name: "Nordic Tech Leadership Summit",
    customer: "Nordic Digital AB",
    venue: "Grand Manor Hall",
    dates: "Oct 24–26, 2026",
    guests: 140,
    phase: "CONFIRMED",
    badgeVariant: "success" as const,
  },
  {
    id: "TCK-802",
    name: "Autumn Symphony Gala Dinner",
    customer: "Svensk Musikfrämjande",
    venue: "Orangeriet Banquet Hall",
    dates: "Oct 28, 2026",
    guests: 260,
    phase: "CONFIRMED",
    badgeVariant: "success" as const,
  },
  {
    id: "TCK-804",
    name: "AstraZeneca Strategy Retreat",
    customer: "AstraZeneca Nordic",
    venue: "Library Salon + Terrace",
    dates: "Nov 02–04, 2026",
    guests: 45,
    phase: "HOLD OPTION",
    badgeVariant: "warning" as const,
  },
  {
    id: "TCK-805",
    name: "Volvo Heritage Board Dinner",
    customer: "Volvo Group Events",
    venue: "Garden Pavilion",
    dates: "Nov 06, 2026",
    guests: 85,
    phase: "QUOTED",
    badgeVariant: "secondary" as const,
  },
  {
    id: "TCK-809",
    name: "Stockholm Architecture Award",
    customer: "Sveriges Arkitekter",
    venue: "Grand Manor + Orangeriet",
    dates: "Nov 12–14, 2026",
    guests: 320,
    phase: "PLANNING",
    badgeVariant: "default" as const,
  },
];

const venueOccupancyMetrics = [
  { name: "Grand Manor Hall", booked: 94, seats: "140 / 150" },
  { name: "Orangeriet Banquet", booked: 82, seats: "205 / 250" },
  { name: "Library Salon", booked: 65, seats: "26 / 40" },
  { name: "Garden Pavilion", booked: 42, seats: "84 / 200" },
];

export function DashboardView() {
  return (
    <PageContainer width="wide" className="space-y-6 py-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
            Operations Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time status for Hesselby Slott • Wednesday, 21 October 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <DownloadIcon className="size-3.5" />
            <span>Export Runsheet</span>
          </Button>
          <Button size="sm" className="gap-1.5">
            <PlusIcon className="size-3.5" />
            <span>New Ticket</span>
          </Button>
        </div>
      </div>

      {/* Hero Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Active Bookings</span>
            <Badge variant="success" className="text-[10px]">
              +4 this week
            </Badge>
          </div>
          <div className="mt-3">
            <HeroNumber value={28} size="lg" />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUpIcon className="size-3.5 text-emerald-600" />
            <span>19 confirmed, 9 hold options</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Upcoming Guests</span>
            <Badge variant="outline" className="text-[10px]">
              Next 14 days
            </Badge>
          </div>
          <div className="mt-3">
            <HeroNumber value={1420} size="lg" />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <UsersIcon className="size-3.5" />
            <span>Across 8 major conferences</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Space Utilization</span>
            <Badge variant="success" className="text-[10px]">
              Peak capacity
            </Badge>
          </div>
          <div className="mt-3">
            <HeroNumber value={86} suffix="%" size="lg" />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Weekend banquet covers committed</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Quotes Awaiting Decision
            </span>
            <Badge variant="warning" className="text-[10px]">
              Action required
            </Badge>
          </div>
          <div className="mt-3">
            <HeroNumber value={6} size="lg" />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangleIcon className="size-3.5" />
            <span>2 holds expire in 48 hours</span>
          </div>
        </Card>
      </div>

      {/* Main Charts & Utilization Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly Event Volume Chart (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Event Volume & Pipeline Distribution</CardTitle>
              <CardDescription>
                Confirmed tickets vs tentative hold options over the next 6 weeks
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-xs"
                  style={{ backgroundColor: chartSeriesColor({ index: 0 }) }}
                />
                Confirmed
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-xs"
                  style={{ backgroundColor: chartSeriesColor({ index: 1 }) }}
                />
                Hold Options
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer label="Confirmed vs tentative hold options per week">
              <BarChart
                data={weeklyOccupancyData}
                margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                <ChartTooltip />
                <Bar
                  dataKey="confirmed"
                  fill={chartSeriesColor({ index: 0 })}
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey="holds" fill={chartSeriesColor({ index: 1 })} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Venue Utilisation Breakdown (1 col) */}
        <Card>
          <CardHeader>
            <CardTitle>Venue Occupancy Today</CardTitle>
            <CardDescription>Capacity allocation across key halls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {venueOccupancyMetrics.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="font-mono text-muted-foreground">
                    {item.seats} ({item.booked}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${item.booked}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="mt-6 rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <CalendarIcon className="size-4 text-primary" />
                <span>Upcoming Turnover Notice</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Grand Manor Hall requires 90-minute banquet teardown on Friday before the Saturday
                wedding setup.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent & High Priority Tickets Table */}
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
                <TableRow key={ticket.id}>
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
                  <TableCell className="text-right font-mono font-medium text-xs">
                    {ticket.guests}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ticket.badgeVariant} className="text-[10px]">
                      {ticket.phase}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
