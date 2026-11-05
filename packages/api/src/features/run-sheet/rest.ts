import { restRoute } from "../../rest-route";

export const runSheetRoutes = [
  restRoute({ operation: "runSheet.list", method: "GET", path: "/run-sheets" }),
  restRoute({
    operation: "runSheet.list",
    method: "GET",
    path: "/orders/{orderId}/run-sheets",
    operationId: "runSheetListByOrder",
  }),
  restRoute({ operation: "runSheet.get", method: "GET", path: "/run-sheets/{id}" }),
  restRoute({ operation: "runSheet.generate", method: "POST", path: "/run-sheets" }),
  restRoute({ operation: "runSheet.publish", method: "POST", path: "/run-sheets/{id}/publish" }),
  restRoute({ operation: "runSheet.fulfill", method: "POST", path: "/run-sheets/{id}/fulfill" }),
  restRoute({
    operation: "runSheet.unfulfill",
    method: "POST",
    path: "/run-sheets/{id}/unfulfill",
  }),
];
