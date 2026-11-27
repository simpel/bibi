/** A bookable time as the guest picks it: the instant to send back and its clock text. */
export type SlotChoice = { startsAt: string; time: string };

/** The times of one sitting ("Lunch", "Dinner"), in order. */
export type SlotGroup = { name: string; slots: SlotChoice[] };

export type GroupSlotsInput = {
  slots: readonly { startsAt: Date; serviceName: string }[];
  /** Writes an instant's clock time in the room's zone (prepared on the server). */
  formatTime: (input: { instant: Date }) => string;
};

/** Times grouped by sitting, sittings in the order of their first time, times ascending. */
export function groupSlots({ slots, formatTime }: GroupSlotsInput): SlotGroup[] {
  const sorted = [...slots].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const groups = new Map<string, SlotGroup>();
  for (const slot of sorted) {
    const group = groups.get(slot.serviceName) ?? { name: slot.serviceName, slots: [] };
    group.slots.push({
      startsAt: slot.startsAt.toISOString(),
      time: formatTime({ instant: slot.startsAt }),
    });
    groups.set(slot.serviceName, group);
  }
  return [...groups.values()];
}
