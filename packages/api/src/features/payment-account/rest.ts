import { restRoute } from "../../rest-route";

export const paymentAccountRoutes = [
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
