import { Bar, BarChart, CartesianGrid, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/card/card";
import { ChartContainer, chartSeriesColor } from "../../components/chart/chart";
import { weeklyOccupancyData } from "./dashboard-data";

function LegendSwatch({ index, label }: { index: number; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="size-2.5 rounded-xs"
        style={{ backgroundColor: chartSeriesColor({ index }) }}
      />
      {label}
    </span>
  );
}

export function DashboardVolumeChart() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Event Volume & Pipeline Distribution</CardTitle>
          <CardDescription>
            Confirmed tickets vs tentative hold options over the next 6 weeks
          </CardDescription>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <LegendSwatch index={0} label="Confirmed" />
          <LegendSwatch index={1} label="Hold Options" />
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
            <Bar dataKey="confirmed" fill={chartSeriesColor({ index: 0 })} radius={[4, 4, 0, 0]} />
            <Bar dataKey="holds" fill={chartSeriesColor({ index: 1 })} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
