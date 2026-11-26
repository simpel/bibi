import { restRoute } from "../../rest-route";

export const diningRoomRoutes = [
  restRoute({ operation: "diningRoom.list", method: "GET", path: "/dining-rooms" }),
  restRoute({ operation: "diningRoom.get", method: "GET", path: "/dining-rooms/{itemId}" }),
  restRoute({ operation: "diningRoom.set", method: "PUT", path: "/dining-rooms/{itemId}" }),
];
