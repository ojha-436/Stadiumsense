import type { SeatLocation } from "@/types/domain";

/** Compact seat label, e.g. "Sec 114 · Row R · Seat 7". Skips empty parts. */
export function seatLabel(seat: SeatLocation): string {
  return [
    seat.section && `Sec ${seat.section}`,
    seat.row && `Row ${seat.row}`,
    seat.seat && `Seat ${seat.seat}`,
  ]
    .filter(Boolean)
    .join(" · ");
}
