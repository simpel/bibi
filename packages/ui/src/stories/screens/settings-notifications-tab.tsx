import { BellIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/card/card";
import { TabsContent } from "../../components/tabs/tabs";
import { SettingsRuleRow } from "./settings-rule-row";

export function SettingsNotificationsTab() {
  return (
    <TabsContent value="notifications" className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BellIcon className="size-5 text-primary" />
            <CardTitle>Staff Alerts & Digest</CardTitle>
          </div>
          <CardDescription>
            Configure which email and in-app notifications are dispatched to managers and head
            chefs.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <SettingsRuleRow
            title="New Quote Requests & Signed Contracts"
            description="Notify account executives immediately when a client signs or requests adjustments."
          />
          <SettingsRuleRow
            title="Kitchen Daily 48-Hour Headcount Alert"
            description="Sends locked dietary and guest counts directly to the executive chef every morning at 07:00."
          />
        </CardContent>
      </Card>
    </TabsContent>
  );
}
