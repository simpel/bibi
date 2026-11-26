import {
  type DiningRoomDto,
  DiningRoomSchema,
  getDiningRoom,
  listDiningRooms,
  setDiningRoom,
} from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const DiningRoomRef = objectFromSchema<DiningRoomDto>({
  name: "DiningRoom",
  schema: DiningRoomSchema,
  description: "A room set up for table booking: its booking page address and open-until limit.",
});
const DiningRoomListRef = pageType({ name: "DiningRoomList", item: DiningRoomRef });

fieldFromOperation({ operation: listDiningRooms, type: DiningRoomListRef, name: "diningRooms" });
fieldFromOperation({ operation: getDiningRoom, type: DiningRoomRef, name: "diningRoom" });
mutationFromOperation({ operation: setDiningRoom, type: DiningRoomRef });
