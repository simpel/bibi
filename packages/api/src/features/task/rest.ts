import { restRoute } from "../../rest-route";

export const taskRoutes = [
  restRoute({ operation: "task.list", method: "GET", path: "/tasks" }),
  restRoute({
    operation: "task.list",
    method: "GET",
    path: "/customers/{customerId}/tasks",
    operationId: "taskListByCustomer",
  }),
  restRoute({
    operation: "task.list",
    method: "GET",
    path: "/orders/{orderId}/tasks",
    operationId: "taskListByOrder",
  }),
  restRoute({ operation: "task.get", method: "GET", path: "/tasks/{id}" }),
  restRoute({ operation: "task.create", method: "POST", path: "/tasks" }),
  restRoute({ operation: "task.update", method: "PATCH", path: "/tasks/{id}" }),
  restRoute({ operation: "task.archive", method: "DELETE", path: "/tasks/{id}" }),
  restRoute({ operation: "task.complete", method: "POST", path: "/tasks/{id}/complete" }),
  restRoute({ operation: "task.reopen", method: "POST", path: "/tasks/{id}/reopen" }),
  restRoute({ operation: "task.move", method: "POST", path: "/tasks/{id}/move" }),
  restRoute({ operation: "task.linkOrder", method: "POST", path: "/tasks/{taskId}/order" }),
  restRoute({
    operation: "task.restore",
    method: "POST",
    path: "/tasks/{id}/restore",
  }),
  restRoute({
    operation: "task.delete",
    method: "DELETE",
    path: "/tasks/{id}/permanent",
  }),
];
