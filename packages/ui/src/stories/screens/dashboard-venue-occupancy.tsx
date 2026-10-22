import { CalendarIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/card/card";
import { venueOccupancyMetrics } from "./dashboard-data";

export function DashboardVenueOccupancy() {
  return (
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
  );
}
