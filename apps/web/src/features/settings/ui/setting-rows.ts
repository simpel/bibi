import { AccountsSettingRow, FiscalYearSettingRow } from "./accounting-setting-rows";
import { DomainJoinSettingRow, TimeZoneSettingRow } from "./organization-setting-rows";
import { DepositSettingRow, PaymentMethodsSettingRow } from "./payment-setting-rows";
import { SeatsSettingRow } from "./seats-setting-row";
import type { SettingRowRegistry } from "./setting-props";

/**
 * One row per setting (`settings.view` key) in the settings card: a new setting key in core is a
 * type error here until it has a row. Each row renders its administration section's own editor.
 */
export const SETTING_ROWS: SettingRowRegistry = {
  timeZone: TimeZoneSettingRow,
  domainJoin: DomainJoinSettingRow,
  paymentMethods: PaymentMethodsSettingRow,
  deposit: DepositSettingRow,
  fiscalYear: FiscalYearSettingRow,
  accounts: AccountsSettingRow,
  seats: SeatsSettingRow,
};
