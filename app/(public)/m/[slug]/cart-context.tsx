"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type { MenuItem } from "@/lib/types";

interface CartState {
  lines: Record<string, number>; // itemId -> qty
}
type Action =
  | { type: "add"; id: string }
  | { type: "dec"; id: string }
  | { type: "remove"; id: string }
  | { type: "clear" }
  | { type: "hydrate"; lines: Record<string, number> };

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "add": {
      const q = state.lines[action.id] ?? 0;
      return { ...state, lines: { ...state.lines, [action.id]: q + 1 } };
    }
    case "dec": {
      const q = state.lines[action.id] ?? 0;
      const next = { ...state.lines };
      if (q <= 1) delete next[action.id];
      else next[action.id] = q - 1;
      return { ...state, lines: next };
    }
    case "remove": {
      const next = { ...state.lines };
      delete next[action.id];
      return { ...state, lines: next };
    }
    case "clear":
      return { lines: {} };
    case "hydrate":
      return { lines: action.lines };
  }
}

interface CartCtx {
  lines: Record<string, number>;
  count: number;
  total: number;
  detailed: { item: MenuItem; qty: number }[];
  dispatch: Dispatch<Action>;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({
  slug,
  items,
  children,
}: {
  slug: string;
  items: MenuItem[];
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, { lines: {} });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`sm-cart-${slug}`);
      if (raw) dispatch({ type: "hydrate", lines: JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(`sm-cart-${slug}`, JSON.stringify(state.lines));
    } catch {
      /* ignore */
    }
  }, [state.lines, slug]);

  const value = useMemo<CartCtx>(() => {
    const byId = new Map(items.map((i) => [i.id, i]));
    const detailed = Object.entries(state.lines)
      .map(([id, qty]) => ({ item: byId.get(id)!, qty }))
      .filter((x) => x.item && !x.item.is_sold_out);
    return {
      lines: state.lines,
      count: detailed.reduce((n, x) => n + x.qty, 0),
      total: detailed.reduce((n, x) => n + x.qty * Number(x.item.price), 0),
      detailed,
      dispatch,
    };
  }, [state.lines, items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart outside CartProvider");
  return ctx;
}
