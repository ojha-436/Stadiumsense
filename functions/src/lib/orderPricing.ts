export interface OrderLineRequest {
  itemId: string;
  qty: number;
}

export interface StallMenuItem {
  itemId: string;
  priceCents: number;
}

/**
 * Computes the authoritative order total server-side from the trusted stall menu.
 * 
 * @param lines The requested items and quantities.
 * @param menu The available menu items with their prices.
 * @returns The calculated total price in cents.
 * @throws {Error} If any item ID in the lines is not found in the menu.
 */
export function computeOrderTotal(
  lines: OrderLineRequest[],
  menu: StallMenuItem[]
): number {
  if (lines.length === 0) {
    return 0;
  }

  // Create a map for quick O(1) lookup of item prices from the menu
  const menuMap = new Map<string, number>();
  for (const item of menu) {
    menuMap.set(item.itemId, item.priceCents);
  }

  let total = 0;

  for (const line of lines) {
    const priceCents = menuMap.get(line.itemId);

    if (priceCents === undefined) {
      // Throw an error immediately if any itemId is missing from the menu
      throw new Error(`Item ID "${line.itemId}" not found in the menu.`);
    }

    // Calculate contribution: qty * priceCents
    total += line.qty * priceCents;
  }

  return total;
}
