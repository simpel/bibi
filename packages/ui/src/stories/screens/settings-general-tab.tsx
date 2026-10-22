import { Building2Icon } from "lucide-react";
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
import { TabsContent } from "../../components/tabs/tabs";
import { SettingsField } from "./settings-field";

const ROW = "grid grid-cols-1 gap-4 sm:grid-cols-2";

function EstateProfileFields() {
  return (
    <CardContent className="space-y-4">
      <div className={ROW}>
        <SettingsField id="estate-name" label="Estate / Venue Name">
          <Input id="estate-name" defaultValue="Hesselby Slott" />
        </SettingsField>
        <SettingsField id="legal-name" label="Legal Entity">
          <Input id="legal-name" defaultValue="Hesselby Slott & Konferens AB" />
        </SettingsField>
      </div>
      <div className={ROW}>
        <SettingsField id="booking-email" label="Primary Booking Email">
          <Input id="booking-email" type="email" defaultValue="bokning@hesselbyslott.se" />
        </SettingsField>
        <SettingsField id="phone" label="Reception Phone">
          <Input id="phone" defaultValue="+46 8 445 51 00" />
        </SettingsField>
      </div>
      <div className={ROW}>
        <SettingsField id="currency" label="Default Operating Currency">
          <Input id="currency" defaultValue="SEK (kr)" disabled className="bg-muted/50" />
        </SettingsField>
        <SettingsField id="timezone" label="Timezone">
          <Input
            id="timezone"
            defaultValue="Europe/Stockholm (CET)"
            disabled
            className="bg-muted/50"
          />
        </SettingsField>
      </div>
    </CardContent>
  );
}

function EstateProfileCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2Icon className="size-5 text-primary" />
          <CardTitle>Estate Profile</CardTitle>
        </div>
        <CardDescription>
          Public organization details displayed on quotes, customer confirmations, and invoices.
        </CardDescription>
      </CardHeader>
      <EstateProfileFields />
      <CardFooter className="flex justify-between border-t border-border px-6 py-4">
        <span className="text-xs text-muted-foreground">
          Changes apply immediately to upcoming quotes.
        </span>
        <Button size="sm">Save Changes</Button>
      </CardFooter>
    </Card>
  );
}

function ServiceBuffersCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Turnover & Service Buffers</CardTitle>
        <CardDescription>
          Standard operational buffers enforced by the scheduling engine.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={ROW}>
          <SettingsField
            id="turnover-buffer"
            label="Hall Turnover Buffer (minutes)"
            hint="Minimum cleanup and arrangement time between events."
          >
            <Input id="turnover-buffer" type="number" defaultValue="60" />
          </SettingsField>
          <SettingsField
            id="curfew"
            label="Evening Music / Event Curfew"
            hint="Swedish environmental noise guideline cutoff."
          >
            <Input id="curfew" defaultValue="02:00" />
          </SettingsField>
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsGeneralTab() {
  return (
    <TabsContent value="general" className="mt-6 space-y-6">
      <EstateProfileCard />
      <ServiceBuffersCard />
    </TabsContent>
  );
}
