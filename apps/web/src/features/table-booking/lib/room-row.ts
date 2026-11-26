export type DiningRoomRow = {
  itemId: string;
  name: string;
  slug: string;
  /** The last open day written for the user; "" = no limit. */
  openUntil: string;
  openUntilSort: number;
};

export type RoomCandidate = { id: string; name: string };
