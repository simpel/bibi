-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "TicketTemplate" ADD COLUMN     "maxGuests" INTEGER,
ADD COLUMN     "minGuests" INTEGER;
