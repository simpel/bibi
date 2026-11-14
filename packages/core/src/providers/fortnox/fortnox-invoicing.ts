import { ok, type Result } from "../../errors/result";
import type { InvoicingPort, ProviderAuth } from "../types";
import { fortnoxApi } from "./fortnox-api";
import { fortnoxNotConnected } from "./fortnox-config";
import { registerFortnoxPayment } from "./fortnox-register-payment";
import { fortnoxRows } from "./fortnox-rows";
import { checkFortnoxSetup } from "./fortnox-setup";

type Authed = { auth: ProviderAuth };

/** The access token core fetched for the call (`getAccessToken`, ADR 0087). */
function tokenOf({ auth }: Authed): Result<string> {
  return auth.accessToken ? ok({ value: auth.accessToken }) : fortnoxNotConnected();
}

/**
 * Fortnox invoicing (ADR 0090, 0100): finds or creates the customer, creates the invoice from the
 * frozen rows, books it and emails it when the customer has an email; lists the payments booked on
 * it; registers card and Swish payments on it; cancels or credits it.
 */
export const fortnoxInvoicing: InvoicingPort = {
  async checkSetup({ auth, needs }) {
    const accessToken = tokenOf({ auth });
    if (!accessToken.ok) return accessToken;
    return checkFortnoxSetup({ accessToken: accessToken.value, needs });
  },
  async issue({ auth, invoice }) {
    const accessToken = tokenOf({ auth });
    if (!accessToken.ok) return accessToken;
    const { customer } = invoice;
    const customerNumber = await fortnoxApi.findOrCreateCustomer({
      accessToken: accessToken.value,
      ...customer,
    });
    if (!customerNumber.ok) return customerNumber;
    const raised = await fortnoxApi.raiseInvoice({
      accessToken: accessToken.value,
      email: customer.email !== null,
      customerNumber: customerNumber.value,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      ourReference: invoice.reference,
      buyerReference: invoice.buyerReference,
      rows: fortnoxRows({ invoice }),
    });
    if (!raised.ok) return raised;
    return ok({ value: { providerReference: raised.value, url: null } });
  },
  async void({ auth, providerReference }) {
    const accessToken = tokenOf({ auth });
    if (!accessToken.ok) return accessToken;
    return fortnoxApi.cancelInvoice({
      accessToken: accessToken.value,
      documentNumber: providerReference,
    });
  },
  async credit({ auth, providerReference }) {
    const accessToken = tokenOf({ auth });
    if (!accessToken.ok) return accessToken;
    const documentNumber = providerReference;
    const credited = await fortnoxApi.creditInvoice({
      accessToken: accessToken.value,
      documentNumber,
    });
    if (!credited.ok) return credited;
    return ok({ value: { providerReference: credited.value, url: null } });
  },
  async registerPayment({ auth, providerReference, payment }) {
    const accessToken = tokenOf({ auth });
    if (!accessToken.ok) return accessToken;
    return registerFortnoxPayment({
      accessToken: accessToken.value,
      documentNumber: providerReference,
      payment,
    });
  },
  async creditStatus({ auth, providerReference }) {
    const accessToken = tokenOf({ auth });
    if (!accessToken.ok) return accessToken;
    const credit = await fortnoxApi.creditOf({
      accessToken: accessToken.value,
      documentNumber: providerReference,
    });
    if (!credit.ok) return credit;
    return ok({
      value: credit.value
        ? { status: "ISSUED" as const, providerReference: credit.value }
        : { status: "MISSING" as const },
    });
  },
  async listPayments({ auth, providerReference }) {
    const accessToken = tokenOf({ auth });
    if (!accessToken.ok) return accessToken;
    const listed = await fortnoxApi.listPayments({
      accessToken: accessToken.value,
      documentNumber: providerReference,
    });
    if (!listed.ok) return listed;
    return ok({
      value: listed.value.map(({ number, amountMinor, paidAt }) => ({
        reference: number,
        amountMinor,
        paidAt,
      })),
    });
  },
};
