import { ShieldCheckIcon } from "lucide-react";
import { Button } from "../../components/button/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/card/card";
import { TabsContent } from "../../components/tabs/tabs";
import { SettingsRuleRow } from "./settings-rule-row";

export function SettingsBookingRulesTab() {
  return (
    <TabsContent value="booking-rules" className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="size-5 text-primary" />
            <CardTitle>Hold Policies & Automation</CardTitle>
          </div>
          <CardDescription>
            Automate quote deadlines and protect key venue dates from overlapping holds.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <SettingsRuleRow
            title="Automatic Hold Expiration"
            badgeVariant="success"
            badgeLabel="Active"
            description="Tentative hold options automatically expire and release the space if the client does not confirm within 7 calendar days."
          />
          <SettingsRuleRow
            title="Dietary & Allergy Lock Date"
            badgeVariant="outline"
            badgeLabel="Operational"
            description="Block ticket changes 5 business days prior to event to guarantee kitchen food prep and accurate supplier orders."
          />
          <SettingsRuleRow
            title="AI Schedule Conflict Warnings"
            badgeVariant="secondary"
            badgeLabel="AI Assistant"
            description="Flag overlapping catering runsheets, insufficient room changeover buffers, and staff shortages automatically."
          />
        </CardContent>
        <CardFooter className="flex justify-end border-t border-border px-6 py-4">
          <Button size="sm">Update Booking Policies</Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}
