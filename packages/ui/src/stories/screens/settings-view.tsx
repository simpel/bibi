import { PageContainer } from "../../components/page-container/page-container";
import { Tabs, TabsList, TabsTrigger } from "../../components/tabs/tabs";
import { SettingsBillingTab } from "./settings-billing-tab";
import { SettingsBookingRulesTab } from "./settings-booking-rules-tab";
import { SettingsGeneralTab } from "./settings-general-tab";
import { SettingsNotificationsTab } from "./settings-notifications-tab";

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

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 sm:w-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="booking-rules">Booking Rules</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing & Stripe</TabsTrigger>
        </TabsList>

        <SettingsGeneralTab />
        <SettingsBookingRulesTab />
        <SettingsNotificationsTab />
        <SettingsBillingTab />
      </Tabs>
    </PageContainer>
  );
}
