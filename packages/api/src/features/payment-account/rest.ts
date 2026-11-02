import { restRoute } from "../../rest-route";

export const paymentAccountRoutes = [
  // The organization's one set of payment settings (ADR 0090), so no id in the path.
  restRoute({ operation: "paymentSettings.get", method: "GET", path: "/payment-settings" }),
  restRoute({ operation: "paymentSettings.update", method: "PATCH", path: "/payment-settings" }),
  restRoute({ operation: "paymentAccount.get", method: "GET", path: "/payment-account" }),
  restRoute({
    operation: "paymentAccount.startOnboarding",
    method: "POST",
    path: "/payment-account/onboarding",
    successStatus: 200,
  }),
  restRoute({
    operation: "paymentAccount.sync",
    method: "POST",
    path: "/payment-account/sync",
    successStatus: 200,
  }),
];
