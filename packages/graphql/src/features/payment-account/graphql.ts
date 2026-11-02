import {
  getPaymentAccount,
  getPaymentSettings,
  type PaymentAccountDto,
  type PaymentAccountOnboardingDto,
  PaymentAccountOnboardingSchema,
  PaymentAccountSchema,
  type PaymentSettingsDto,
  PaymentSettingsSchema,
  startPaymentOnboarding,
  syncPaymentAccount,
  disconnectPaymentAccount,
  updatePaymentSettings,
} from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

export const PaymentAccountRef = objectFromSchema<PaymentAccountDto>({
  name: "PaymentAccount",
  schema: PaymentAccountSchema,
  omit: ["organizationId"],
  description: "The organization's Stripe Connect payout account; NOT_CONNECTED until onboarding.",
});
const PaymentAccountOnboardingRef = objectFromSchema<PaymentAccountOnboardingDto>({
  name: "PaymentAccountOnboarding",
  schema: PaymentAccountOnboardingSchema,
  omit: ["organizationId"],
  description: "The payout account plus the short-lived Stripe onboarding link.",
});

fieldFromOperation({
  operation: getPaymentAccount,
  type: PaymentAccountRef,
  name: "paymentAccount",
});
mutationFromOperation({ operation: startPaymentOnboarding, type: PaymentAccountOnboardingRef });
mutationFromOperation({ operation: syncPaymentAccount, type: PaymentAccountRef });
mutationFromOperation({ operation: disconnectPaymentAccount, type: PaymentAccountRef });

const PaymentSettingsRef = objectFromSchema<PaymentSettingsDto>({
  name: "PaymentSettings",
  schema: PaymentSettingsSchema,
  description: "How the organization takes ticket money (ADR 0090); empty until first saved.",
});
fieldFromOperation({
  operation: getPaymentSettings,
  type: PaymentSettingsRef,
  name: "paymentSettings",
});
mutationFromOperation({ operation: updatePaymentSettings, type: PaymentSettingsRef });
