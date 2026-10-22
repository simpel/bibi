import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "../../components/badge/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/card/card";
import { ChartContainer, chartSeriesColor } from "../../components/chart/chart";
import { weekendOccupancyData } from "./ai-chat-data";

const series = [
  { name: "Grand Manor Hall", dataKey: "grandManor" },
  { name: "Orangeriet", dataKey: "orangeriet" },
  { name: "Library Salon", dataKey: "librarySalon" },
];

function OccupancyHeader() {
  return (
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-base font-medium">November Weekend Occupancy Rate</CardTitle>
          <CardDescription className="text-xs">
            Percentage of available seating capacity booked per weekend
          </CardDescription>
        </div>
        <Badge variant="secondary" className="font-mono text-[10px]">
          Hesselby Slott
        </Badge>
      </div>
    </CardHeader>
  );
}

export function AIChatOccupancyChart() {
  return (
    <Card className="my-2 border border-border/80 shadow-xs">
      <OccupancyHeader />
      <CardContent className="pt-2">
        <ChartContainer label="November weekend occupancy rate by hall">
          <BarChart
            data={weekendOccupancyData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="week" tickLine={false} axisLine={false} />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
              axisLine={false}
              width={38}
            />
            <ChartTooltip formatter={(value) => [`${value}%`, ""]} />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            {series.map((item, index) => (
              <Bar
                key={item.dataKey}
                name={item.name}
                dataKey={item.dataKey}
                fill={chartSeriesColor({ index })}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
