import { useSyncExternalStore } from "react";

export type Person = { id: string; name: string; color: string };
export type Item = {
  id: string;
  name: string;
  price: number;
  claimedBy: string[];
  /** Original line quantity from the receipt (e.g. 2 for "House Red x2"). Lets the UI offer "split into individual items". */
  qty?: number;
};

export type DutchState = {
  receiptImage: string | null;
  items: Item[];
  people: Person[];
  selectedPersonId: string | null;
  tax: number;
  tip: number;
  /** ISO 4217 currency code detected from the receipt, e.g. "USD", "EUR", "INR". */
  currency: string;
};

const AVATAR_COLORS = [
  "oklch(0.68 0.19 25)",
  "oklch(0.72 0.15 145)",
  "oklch(0.68 0.16 250)",
  "oklch(0.75 0.15 75)",
  "oklch(0.65 0.18 310)",
  "oklch(0.7 0.14 195)",
];

const initial: DutchState = {
  receiptImage: null,
  items: [],
  people: [],
  selectedPersonId: null,
  tax: 0,
  tip: 0,
  currency: "USD",
};

const KNOWN_CURRENCIES = new Set([
  "USD", "EUR", "GBP", "JPY", "INR", "CAD", "AUD", "CNY", "CHF", "SEK",
  "NZD", "MXN", "SGD", "HKD", "NOK", "KRW", "TRY", "RUB", "BRL", "ZAR",
  "AED", "SAR", "THB", "MYR", "IDR", "PHP", "VND", "PLN", "DKK", "ILS",
]);

function normalizeCurrency(code: unknown): string {
  const c = typeof code === "string" ? code.trim().toUpperCase() : "";
  return KNOWN_CURRENCIES.has(c) ? c : "USD";
}

// Bumped whenever DutchState's shape changes, so old saved sessions don't crash-load.
const STORAGE_KEY = "dutch-state-v1";

function persist(s: DutchState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // storage full or unavailable (private browsing) — not worth surfacing
  }
}

let state: DutchState = initial;
const listeners = new Set<() => void>();

function set(next: Partial<DutchState> | ((s: DutchState) => Partial<DutchState>)) {
  const patch = typeof next === "function" ? next(state) : next;
  state = { ...state, ...patch };
  persist(state);
  listeners.forEach((l) => l());
}

export const dutchStore = {
  getState: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  // Call once on the client after mount (SSR has no localStorage, and
  // reading it before mount would cause a hydration mismatch).
  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<DutchState>;
      state = { ...state, ...saved };
      listeners.forEach((l) => l());
    } catch {
      // corrupted/incompatible saved state — ignore and keep fresh state
    }
  },
  setReceipt: (dataUrl: string) => set({ receiptImage: dataUrl }),
  loadDemoParsedReceipt: () => {
    const demoItems: Item[] = [
      { id: "i1", name: "Truffle Fries", price: 14, claimedBy: [] },
      { id: "i2", name: "Margherita Pizza", price: 22, claimedBy: [] },
      { id: "i3", name: "Caesar Salad", price: 16, claimedBy: [] },
      { id: "i4", name: "Grilled Salmon", price: 32, claimedBy: [] },
      { id: "i5", name: "Ribeye Steak", price: 48, claimedBy: [] },
      { id: "i6", name: "House Red (Glass)", price: 12, claimedBy: [] },
      { id: "i7", name: "House Red (Glass)", price: 12, claimedBy: [] },
      { id: "i8", name: "Sparkling Water", price: 6, claimedBy: [] },
      { id: "i9", name: "Tiramisu", price: 11, claimedBy: [] },
      { id: "i10", name: "Espresso", price: 4, claimedBy: [] },
    ];
    const subtotal = demoItems.reduce((s, i) => s + i.price, 0);
    set({
      items: demoItems,
      tax: +(subtotal * 0.0875).toFixed(2),
      tip: +(subtotal * 0.2).toFixed(2),
      currency: "USD",
      people:
        state.people.length > 0
          ? state.people
          : [
              { id: "p1", name: "Sam", color: AVATAR_COLORS[0] },
              { id: "p2", name: "Alex", color: AVATAR_COLORS[1] },
              { id: "p3", name: "Jordan", color: AVATAR_COLORS[2] },
            ],
      selectedPersonId: state.selectedPersonId ?? "p1",
    });
  },
  setParsedReceipt: (parsed: {
    items: { name: string; price: number; qty?: number }[];
    tax: number;
    tip: number;
    currency?: string;
  }) => {
    const items: Item[] = parsed.items.map((it, i) => ({
      id: "i" + i + "-" + Math.random().toString(36).slice(2, 6),
      name: it.name,
      price: it.price,
      claimedBy: [],
      qty: it.qty && it.qty > 1 ? Math.round(it.qty) : undefined,
    }));
    set({ items, tax: parsed.tax || 0, tip: parsed.tip || 0, currency: normalizeCurrency(parsed.currency) });
  },
  addPerson: (name: string) => {
    const id = "p" + Math.random().toString(36).slice(2, 8);
    const color = AVATAR_COLORS[state.people.length % AVATAR_COLORS.length];
    set((s) => ({
      people: [...s.people, { id, name: name.trim() || `Guest ${s.people.length + 1}`, color }],
      selectedPersonId: s.selectedPersonId ?? id,
    }));
  },
  selectPerson: (id: string) => set({ selectedPersonId: id }),
  removePerson: (id: string) => {
    set((s) => {
      const people = s.people.filter((p) => p.id !== id);
      return {
        people,
        items: s.items.map((it) => ({ ...it, claimedBy: it.claimedBy.filter((pid) => pid !== id) })),
        selectedPersonId:
          s.selectedPersonId === id ? (people[0]?.id ?? null) : s.selectedPersonId,
      };
    });
  },
  renamePerson: (id: string, name: string) => {
    set((s) => ({
      people: s.people.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)),
    }));
  },
  addItem: (name: string, price: number) => {
    const id = "i" + Math.random().toString(36).slice(2, 8);
    set((s) => ({
      items: [
        ...s.items,
        { id, name: name.trim() || "Item", price: Math.max(0, price), claimedBy: [] },
      ],
    }));
  },
  updateItemPrice: (itemId: string, price: number) => {
    set((s) => ({
      items: s.items.map((it) => (it.id === itemId ? { ...it, price: Math.max(0, price) } : it)),
    }));
  },
  removeItem: (itemId: string) => {
    set((s) => ({ items: s.items.filter((it) => it.id !== itemId) }));
  },
  // Unbundles a merged multi-qty line (e.g. "House Red x2" priced as one $24
  // item) into `qty` separate $12 items, so two people can each claim their
  // own glass instead of splitting one shared item down the middle.
  splitItemIntoUnits: (itemId: string) => {
    set((s) => {
      const item = s.items.find((it) => it.id === itemId);
      if (!item || !item.qty || item.qty < 2) return {};
      const unitPrice = +(item.price / item.qty).toFixed(2);
      const units: Item[] = Array.from({ length: item.qty }, (_, i) => ({
        id: `${item.id}-u${i}-${Math.random().toString(36).slice(2, 5)}`,
        name: item.name,
        price: unitPrice,
        claimedBy: [],
      }));
      const idx = s.items.findIndex((it) => it.id === itemId);
      const items = [...s.items];
      items.splice(idx, 1, ...units);
      return { items };
    });
  },
  toggleClaim: (itemId: string) => {
    const pid = state.selectedPersonId;
    if (!pid) return;
    set((s) => ({
      items: s.items.map((it) => {
        if (it.id !== itemId) return it;
        const has = it.claimedBy.includes(pid);
        return { ...it, claimedBy: has ? it.claimedBy.filter((p) => p !== pid) : [...it.claimedBy, pid] };
      }),
    }));
  },
  splitRemainingEvenly: () => {
    set((s) => ({
      items: s.items.map((it) =>
        it.claimedBy.length === 0 ? { ...it, claimedBy: s.people.map((p) => p.id) } : it,
      ),
    }));
  },
  reset: () => {
    state = { ...initial };
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    listeners.forEach((l) => l());
  },
};

export function useDutch<T>(selector: (s: DutchState) => T): T {
  return useSyncExternalStore(
    dutchStore.subscribe,
    () => selector(state),
    () => selector(state),
  );
}

const moneyFormatters = new Map<string, Intl.NumberFormat>();

/** Formats a number as money in the given ISO currency code, always with English digits/symbols. */
export function formatMoney(value: number, currency: string): string {
  const code = normalizeCurrency(currency);
  let fmt = moneyFormatters.get(code);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: code });
    moneyFormatters.set(code, fmt);
  }
  return fmt.format(value);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function computeTotals(s: DutchState) {
  const subtotal = s.items.reduce((sum, it) => sum + it.price, 0);
  const perPerson: Record<string, { subtotal: number; items: { name: string; share: number }[] }> = {};
  s.people.forEach((p) => (perPerson[p.id] = { subtotal: 0, items: [] }));
  s.items.forEach((it) => {
    if (it.claimedBy.length === 0) return;
    const share = it.price / it.claimedBy.length;
    it.claimedBy.forEach((pid) => {
      if (!perPerson[pid]) return;
      perPerson[pid].subtotal += share;
      perPerson[pid].items.push({ name: it.name, share });
    });
  });
  const totalClaimed = Object.values(perPerson).reduce((a, b) => a + b.subtotal, 0) || 1;
  const totals = s.people.map((p) => {
    const pp = perPerson[p.id];
    const ratio = pp.subtotal / totalClaimed;
    const taxShare = s.tax * ratio;
    const tipShare = s.tip * ratio;
    return {
      person: p,
      subtotal: pp.subtotal,
      tax: taxShare,
      tip: tipShare,
      total: pp.subtotal + taxShare + tipShare,
      items: pp.items,
    };
  });
  return { subtotal, tax: s.tax, tip: s.tip, total: subtotal + s.tax + s.tip, totals };
}

// Deliberately not part of DutchState/localStorage — a one-shot banner
// message for when receipt parsing fails and falls back to the demo bill,
// so that fallback is visible instead of silently pretending to be real data.
let lastParseError: string | null = null;
const parseErrorListeners = new Set<() => void>();

export const parseErrorStore = {
  set: (message: string | null) => {
    lastParseError = message;
    parseErrorListeners.forEach((l) => l());
  },
  subscribe: (l: () => void) => {
    parseErrorListeners.add(l);
    return () => parseErrorListeners.delete(l);
  },
  get: () => lastParseError,
};

export function useParseError(): string | null {
  return useSyncExternalStore(parseErrorStore.subscribe, parseErrorStore.get, () => null);
}
