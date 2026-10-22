export const weeklyOccupancyData = [
  { week: "W43 (Oct 20)", confirmed: 6, holds: 2 },
  { week: "W44 (Oct 27)", confirmed: 8, holds: 3 },
  { week: "W45 (Nov 03)", confirmed: 9, holds: 4 },
  { week: "W46 (Nov 10)", confirmed: 12, holds: 2 },
  { week: "W47 (Nov 17)", confirmed: 7, holds: 5 },
  { week: "W48 (Nov 24)", confirmed: 10, holds: 1 },
];

export const upcomingTickets = [
  {
    id: "TCK-801",
    name: "Nordic Tech Leadership Summit",
    customer: "Nordic Digital AB",
    venue: "Grand Manor Hall",
    dates: "Oct 24–26, 2026",
    guests: 140,
    phase: "CONFIRMED",
    badgeVariant: "success" as const,
  },
  {
    id: "TCK-802",
    name: "Autumn Symphony Gala Dinner",
    customer: "Svensk Musikfrämjande",
    venue: "Orangeriet Banquet Hall",
    dates: "Oct 28, 2026",
    guests: 260,
    phase: "CONFIRMED",
    badgeVariant: "success" as const,
  },
  {
    id: "TCK-804",
    name: "AstraZeneca Strategy Retreat",
    customer: "AstraZeneca Nordic",
    venue: "Library Salon + Terrace",
    dates: "Nov 02–04, 2026",
    guests: 45,
    phase: "HOLD OPTION",
    badgeVariant: "warning" as const,
  },
  {
    id: "TCK-805",
    name: "Volvo Heritage Board Dinner",
    customer: "Volvo Group Events",
    venue: "Garden Pavilion",
    dates: "Nov 06, 2026",
    guests: 85,
    phase: "QUOTED",
    badgeVariant: "secondary" as const,
  },
  {
    id: "TCK-809",
    name: "Stockholm Architecture Award",
    customer: "Sveriges Arkitekter",
    venue: "Grand Manor + Orangeriet",
    dates: "Nov 12–14, 2026",
    guests: 320,
    phase: "PLANNING",
    badgeVariant: "default" as const,
  },
];

export const venueOccupancyMetrics = [
  { name: "Grand Manor Hall", booked: 94, seats: "140 / 150" },
  { name: "Orangeriet Banquet", booked: 82, seats: "205 / 250" },
  { name: "Library Salon", booked: 65, seats: "26 / 40" },
  { name: "Garden Pavilion", booked: 42, seats: "84 / 200" },
];
