import { DownloadIcon, PlusIcon } from "lucide-react";
import { Button } from "../../components/button/button";
import { PageContainer } from "../../components/page-container/page-container";
import { DashboardMetrics } from "./dashboard-metrics";
import { DashboardTicketsTable } from "./dashboard-tickets-table";
import { DashboardVenueOccupancy } from "./dashboard-venue-occupancy";
import { DashboardVolumeChart } from "./dashboard-volume-chart";

function DashboardTitleBar() {
  return (
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
  );
}

export function DashboardView() {
  return (
    <PageContainer width="wide" className="space-y-6 py-6">
      <DashboardTitleBar />
      <DashboardMetrics />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardVolumeChart />
        <DashboardVenueOccupancy />
      </div>
      <DashboardTicketsTable />
    </PageContainer>
  );
}
