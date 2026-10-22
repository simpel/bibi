import { restRoute } from "../../rest-route";

/** The caller's own files (ADR 0063); keys contain `/`, so `file.get` takes `?key=`. */
export const fileRoutes = [
  restRoute({ operation: "file.upload", method: "POST", path: "/files" }),
  restRoute({ operation: "file.get", method: "GET", path: "/files" }),
];
