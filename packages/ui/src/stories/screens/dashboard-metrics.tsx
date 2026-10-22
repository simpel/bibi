import { AlertTriangleIcon, TrendingUpIcon, UsersIcon } from "lucide-react";
import { HeroNumber } from "../../components/hero-number/hero-number";
import { DashboardMetricCard } from "./dashboard-metric-card";

function BookingMetrics() {
  return (
    <>
      <DashboardMetricCard
        label="Active Bookings"
        badgeVariant="success"
        badgeLabel="+4 this week"
        hero={<HeroNumber value={28} size="lg" />}
        footer={
          <>
            <TrendingUpIcon className="size-3.5 text-emerald-600" />
            <span>19 confirmed, 9 hold options</span>
          </>
        }
      />
      <DashboardMetricCard
        label="Upcoming Guests"
        badgeVariant="outline"
        badgeLabel="Next 14 days"
        hero={<HeroNumber value={1420} size="lg" />}
        footer={
          <>
            <UsersIcon className="size-3.5" />
            <span>Across 8 major conferences</span>
          </>
        }
      />
    </>
  );
}

function PipelineMetrics() {
  return (
    <>
      <DashboardMetricCard
        label="Space Utilization"
        badgeVariant="success"
        badgeLabel="Peak capacity"
        hero={<HeroNumber value={86} suffix="%" size="lg" />}
        footer={<span>Weekend banquet covers committed</span>}
      />
      <DashboardMetricCard
        label="Quotes Awaiting Decision"
        badgeVariant="warning"
        badgeLabel="Action required"
        hero={<HeroNumber value={6} size="lg" />}
        footerClassName="text-amber-700 dark:text-amber-400"
        footer={
          <>
            <AlertTriangleIcon className="size-3.5" />
            <span>2 holds expire in 48 hours</span>
          </>
        }
      />
    </>
  );
}

export function DashboardMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <BookingMetrics />
      <PipelineMetrics />
    </div>
  );
}
