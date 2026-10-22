import { CreditCardIcon, ShieldCheckIcon } from "lucide-react";
import { Badge } from "../../components/badge/badge";
import { Button } from "../../components/button/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/card/card";
import { Input } from "../../components/input/input";
import { TabsContent } from "../../components/tabs/tabs";
import { SettingsField } from "./settings-field";

function StripeAccountPanel() {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheckIcon className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground">
                Hesselby Slott Stripe Account
              </span>
              <Badge variant="success" className="text-[10px]">
                Verified & Connected
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Account id: acct_1K89201940982</p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          Manage in Stripe
        </Button>
      </div>
    </div>
  );
}

export function SettingsBillingTab() {
  return (
    <TabsContent value="billing" className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCardIcon className="size-5 text-primary" />
            <CardTitle>Stripe Connect Payments</CardTitle>
          </div>
          <CardDescription>
            Direct customer deposits, invoice link generation, and corporate bank payouts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StripeAccountPanel />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
            <SettingsField
              label="Standard Deposit Required"
              hint="Payable within 10 days of signing confirmation."
            >
              <Input defaultValue="25%" />
            </SettingsField>
            <SettingsField
              label="Final Balance Due (days before event)"
              hint="Automatic reminder email triggered."
            >
              <Input defaultValue="14 days" />
            </SettingsField>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
