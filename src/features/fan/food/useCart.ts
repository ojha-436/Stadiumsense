import { useCallback, useMemo, useReducer } from "react";
import type { MenuItem, Stall } from "@/types/domain";

export interface CartLine {
  itemId: string;
  name: string;
  priceCents: number;
  qty: number;
}

interface CartState {
  stallId: string | null;
  stallName: string | null;
  lines: Record<string, CartLine>;
}

type Action =
  | { type: "add"; stall: Stall; item: MenuItem }
  | { type: "remove"; itemId: string }
  | { type: "clear" };

const EMPTY: CartState = { stallId: null, stallName: null, lines: {} };

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "add": {
      // A cart holds items from a single stall; switching stalls resets it.
      const base =
        state.stallId && state.stallId !== action.stall.id
          ? { stallId: action.stall.id, stallName: action.stall.name, lines: {} }
          : { ...state, stallId: action.stall.id, stallName: action.stall.name };
      const existing = base.lines[action.item.itemId];
      const qty = (existing?.qty ?? 0) + 1;
      return {
        ...base,
        lines: {
          ...base.lines,
          [action.item.itemId]: {
            itemId: action.item.itemId,
            name: action.item.name,
            priceCents: action.item.priceCents,
            qty,
          },
        },
      };
    }
    case "remove": {
      const next = { ...state.lines };
      const line = next[action.itemId];
      if (!line) return state;
      if (line.qty <= 1) delete next[action.itemId];
      else next[action.itemId] = { ...line, qty: line.qty - 1 };
      const empty = Object.keys(next).length === 0;
      return empty ? EMPTY : { ...state, lines: next };
    }
    case "clear":
      return EMPTY;
  }
}

export interface UseCartResult {
  stallId: string | null;
  stallName: string | null;
  lines: CartLine[];
  totalCents: number;
  count: number;
  add: (stall: Stall, item: MenuItem) => void;
  remove: (itemId: string) => void;
  clear: () => void;
}

export function useCart(): UseCartResult {
  const [state, dispatch] = useReducer(reducer, EMPTY);

  const lines = useMemo(() => Object.values(state.lines), [state.lines]);
  const totalCents = useMemo(
    () => lines.reduce((sum, l) => sum + l.priceCents * l.qty, 0),
    [lines]
  );
  const count = useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines]);

  const add = useCallback((stall: Stall, item: MenuItem) => dispatch({ type: "add", stall, item }), []);
  const remove = useCallback((itemId: string) => dispatch({ type: "remove", itemId }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  return {
    stallId: state.stallId,
    stallName: state.stallName,
    lines,
    totalCents,
    count,
    add,
    remove,
    clear,
  };
}
