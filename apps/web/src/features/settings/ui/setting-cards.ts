import { AccountsSettingCard, FiscalYearSettingCard } from "./accounting-setting-cards";
import { DomainJoinSettingCard, TimeZoneSettingCard } from "./organization-setting-cards";
import {
  DepositSettingCard,
  InvoicesSettingCard,
  PaymentOperatorSettingCard,
} from "./payment-setting-cards";
import { SeatsSettingCard } from "./seats-setting-card";
import type { SettingCardRegistry } from "./setting-props";

/**
 * One card per setting (`settings.view` key): a new setting key in core is a type error here
 * until it has a card. Each card renders its administration section's own editor.
 */
export const SETTING_CARDS: SettingCardRegistry = {
  timeZone: TimeZoneSettingCard,
  domainJoin: DomainJoinSettingCard,
  paymentOperator: PaymentOperatorSettingCard,
  deposit: DepositSettingCard,
  invoices: InvoicesSettingCard,
  fiscalYear: FiscalYearSettingCard,
  accounts: AccountsSettingCard,
  seats: SeatsSettingCard,
};
