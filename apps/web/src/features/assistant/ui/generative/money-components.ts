import { DepositCardView } from "./deposit-card-view";
import { DepositTableView } from "./deposit-table-view";
import { InvoiceCardView } from "./invoice-card-view";
import { InvoiceTableView } from "./invoice-table-view";
import { PaymentAccountCardView } from "./payment-account-card-view";
import { PaymentCardView } from "./payment-card-view";
import { PaymentTableView } from "./payment-table-view";
import { TicketBalanceCardView } from "./ticket-balance-card-view";

/** Payments, receivables and the derived balance (ADR 0057), part of `GENERATIVE_COMPONENTS`. */
export const MONEY_COMPONENTS = {
  "payment-account-card": PaymentAccountCardView,
  "payment-table": PaymentTableView,
  "payment-card": PaymentCardView,
  "ticket-balance-card": TicketBalanceCardView,
  "deposit-table": DepositTableView,
  "deposit-card": DepositCardView,
  "invoice-table": InvoiceTableView,
  "invoice-card": InvoiceCardView,
} as const;
