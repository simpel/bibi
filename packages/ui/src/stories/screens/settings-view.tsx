import { BellIcon, Building2Icon, CreditCardIcon, ShieldCheckIcon } from "lucide-react";
import { Badge } from "../../components/badge/badge";
import { Button } from "../../components/button/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/card/card";
import { Input } from "../../components/input/input";
import { Label } from "../../components/label/label";
import { PageContainer } from "../../components/page-container/page-container";
import { Switch } from "../../components/switch/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/tabs/tabs";

export function SettingsView() {
  return (
    <PageContainer width="default" className="space-y-6 py-6">
      {/* Title & Introduction */}
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
          Estate Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage venue configurations, automated booking rules, and staff permissions.
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 sm:w-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="booking-rules">Booking Rules</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing & Stripe</TabsTrigger>
        </TabsList>

        {/* Tab 1: General */}
        <TabsContent value="general" className="mt-6 space-y-6">
          {/* Estate Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2Icon className="size-5 text-primary" />
                <CardTitle>Estate Profile</CardTitle>
              </div>
              <CardDescription>
                Public organization details displayed on quotes, customer confirmations, and
                invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="estate-name">Estate / Venue Name</Label>
                  <Input id="estate-name" defaultValue="Hesselby Slott" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legal-name">Legal Entity</Label>
                  <Input id="legal-name" defaultValue="Hesselby Slott & Konferens AB" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="booking-email">Primary Booking Email</Label>
                  <Input id="booking-email" type="email" defaultValue="bokning@hesselbyslott.se" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Reception Phone</Label>
                  <Input id="phone" defaultValue="+46 8 445 51 00" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Operating Currency</Label>
                  <Input id="currency" defaultValue="SEK (kr)" disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    defaultValue="Europe/Stockholm (CET)"
                    disabled
                    className="bg-muted/50"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border px-6 py-4">
              <span className="text-xs text-muted-foreground">
                Changes apply immediately to upcoming quotes.
              </span>
              <Button size="sm">Save Changes</Button>
            </CardFooter>
          </Card>

          {/* Service Standards */}
          <Card>
            <CardHeader>
              <CardTitle>Turnover & Service Buffers</CardTitle>
              <CardDescription>
                Standard operational buffers enforced by the scheduling engine.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="turnover-buffer">Hall Turnover Buffer (minutes)</Label>
                  <Input id="turnover-buffer" type="number" defaultValue="60" />
                  <p className="text-[11px] text-muted-foreground">
                    Minimum cleanup and arrangement time between events.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="curfew">Evening Music / Event Curfew</Label>
                  <Input id="curfew" defaultValue="02:00" />
                  <p className="text-[11px] text-muted-foreground">
                    Swedish environmental noise guideline cutoff.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Booking Rules */}
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
              {/* Rule 1 */}
              <div className="flex items-start justify-between py-4">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      Automatic Hold Expiration
                    </span>
                    <Badge variant="success" className="text-[10px]">
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tentative hold options automatically expire and release the space if the client
                    does not confirm within 7 calendar days.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Rule 2 */}
              <div className="flex items-start justify-between py-4">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      Dietary & Allergy Lock Date
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Operational
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Block ticket changes 5 business days prior to event to guarantee kitchen food
                    prep and accurate supplier orders.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Rule 3 */}
              <div className="flex items-start justify-between py-4">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      AI Schedule Conflict Warnings
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      AI Assistant
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Flag overlapping catering runsheets, insufficient room changeover buffers, and
                    staff shortages automatically.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-border px-6 py-4">
              <Button size="sm">Update Booking Policies</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab 3: Notifications */}
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
              <div className="flex items-start justify-between py-4">
                <div className="space-y-1 pr-4">
                  <span className="text-sm font-medium text-foreground">
                    New Quote Requests & Signed Contracts
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Notify account executives immediately when a client signs or requests
                    adjustments.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-start justify-between py-4">
                <div className="space-y-1 pr-4">
                  <span className="text-sm font-medium text-foreground">
                    Kitchen Daily 48-Hour Headcount Alert
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Sends locked dietary and guest counts directly to the executive chef every
                    morning at 07:00.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Billing */}
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
                      <p className="text-xs text-muted-foreground">
                        Account id: acct_1K89201940982
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage in Stripe
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label>Standard Deposit Required</Label>
                  <Input defaultValue="25%" />
                  <p className="text-[11px] text-muted-foreground">
                    Payable within 10 days of signing confirmation.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Final Balance Due (days before event)</Label>
                  <Input defaultValue="14 days" />
                  <p className="text-[11px] text-muted-foreground">
                    Automatic reminder email triggered.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
