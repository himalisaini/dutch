import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Shuffle, X, Pencil, SplitSquareHorizontal, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { PhoneShell, Avatar } from "@/components/PhoneShell";
import { dutchStore, useDutch, computeTotals, initials, formatMoney, useParseError, parseErrorStore } from "@/lib/dutch-store";

export const Route = createFileRoute("/claim")({
  head: () => ({
    meta: [
      { title: "Tap what's yours — Dutch" },
      { name: "description", content: "Tap each item to claim it. Dutch splits shared items automatically." },
      { property: "og:title", content: "Tap what's yours — Dutch" },
      { property: "og:description", content: "Tap each item to claim it. Dutch does the math." },
    ],
  }),
  component: Claim,
});

function Claim() {
  const items = useDutch((s) => s.items);
  const people = useDutch((s) => s.people);
  const selectedId = useDutch((s) => s.selectedPersonId);
  const state = useDutch((s) => s);
  const currency = state.currency;
  const { totals } = computeTotals(state);
  const [addingName, setAddingName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  const selectedTotal = totals.find((t) => t.person.id === selectedId)?.subtotal ?? 0;
  const parseError = useParseError();

  const startEditingPrice = (itemId: string, price: number) => {
    setEditingItemId(itemId);
    setEditingPrice(String(price));
  };

  const commitEditingPrice = () => {
    if (editingItemId) {
      const price = parseFloat(editingPrice);
      if (!Number.isNaN(price)) dutchStore.updateItemPrice(editingItemId, price);
    }
    setEditingItemId(null);
  };

  const submitNewItem = () => {
    const price = parseFloat(newItemPrice);
    if (newItemName.trim() && !Number.isNaN(price)) {
      dutchStore.addItem(newItemName, price);
    }
    setNewItemName("");
    setNewItemPrice("");
    setShowAddItem(false);
  };

  return (
    <PhoneShell>
      <div className="safe-top flex flex-1 flex-col">
        {/* Header */}
        <div className="px-5 pt-2">
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Who had what?</h1>
            <Link to="/capture" className="text-sm text-muted-foreground">
              Retake
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick yourself, then tap items you ordered.
          </p>
        </div>

        {parseError && (
          <div className="mx-5 mt-3 flex items-start gap-2 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1">{parseError}</p>
            <button
              onClick={() => parseErrorStore.set(null)}
              aria-label="Dismiss"
              className="shrink-0 text-destructive/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* People tray */}
        <div className="mt-4 px-5">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none]">
            {people.map((p) => {
              const isSel = p.id === selectedId;
              const pTotal = totals.find((t) => t.person.id === p.id)?.subtotal ?? 0;
              return (
                <div key={p.id} className="relative shrink-0">
                  <button
                    onClick={() => dutchStore.selectPerson(p.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl px-3 py-2 transition ${
                      isSel ? "bg-primary/10" : ""
                    }`}
                  >
                    <Avatar name={p.name} color={p.color} size={48} ring={isSel} />
                    <span className={`text-xs font-semibold ${isSel ? "text-primary" : ""}`}>
                      {p.name}
                    </span>
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {formatMoney(pTotal, currency)}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dutchStore.removePerson(p.id);
                    }}
                    aria-label={`Remove ${p.name}`}
                    className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-foreground/70 text-background shadow active:scale-90 transition before:absolute before:-inset-3 before:content-['']"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}

            {showAdd ? (
              <div className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl bg-surface px-3 py-2">
                <input
                  autoFocus
                  value={addingName}
                  onChange={(e) => setAddingName(e.target.value)}
                  onBlur={() => {
                    if (addingName.trim()) dutchStore.addPerson(addingName);
                    setAddingName("");
                    setShowAdd(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      dutchStore.addPerson(addingName);
                      setAddingName("");
                      setShowAdd(false);
                    }
                  }}
                  placeholder="Name"
                  className="h-12 w-16 rounded-full bg-background text-center text-sm outline-none ring-2 ring-primary/40"
                />
                <span className="text-[10px] text-muted-foreground">Enter to save</span>
              </div>
            ) : (
              <button
                onClick={() => setShowAdd(true)}
                className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-3 py-2"
                aria-label="Add person"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-dashed border-muted-foreground/40 text-muted-foreground">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-xs text-muted-foreground">Add</span>
              </button>
            )}
          </div>
        </div>

        {/* Items bubbles */}
        <div className="mt-2 flex-1 overflow-y-auto px-5 pb-40">
          <div className="flex flex-wrap gap-2.5">
            {items.map((it) => {
              const claimed = it.claimedBy.length > 0;
              const isMine = selectedId ? it.claimedBy.includes(selectedId) : false;
              const perHead = it.price / Math.max(1, it.claimedBy.length);
              const isEditing = editingItemId === it.id;
              return (
                <div
                  key={it.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => !isEditing && dutchStore.toggleClaim(it.id)}
                  onKeyDown={(e) => {
                    if (!isEditing && (e.key === "Enter" || e.key === " ")) dutchStore.toggleClaim(it.id);
                  }}
                  className={`group relative flex flex-col items-start gap-1.5 rounded-2xl px-4 py-3 text-left transition active:scale-[0.97] cursor-pointer ${
                    isMine
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : claimed
                        ? "bg-accent text-accent-foreground"
                        : "bg-surface"
                  }`}
                >
                  <div className="absolute right-1 top-1 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingPrice(it.id, it.price);
                      }}
                      aria-label={`Edit price of ${it.name}`}
                      className="hit-slop-l grid h-5 w-5 place-items-center rounded-full bg-foreground/70 text-background shadow active:scale-90 transition"
                    >
                      <Pencil className="h-2.5 w-2.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dutchStore.removeItem(it.id);
                      }}
                      aria-label={`Remove ${it.name}`}
                      className="hit-slop-r grid h-5 w-5 place-items-center rounded-full bg-foreground/70 text-background shadow active:scale-90 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  <span className="pr-11 text-[13px] font-medium leading-tight">{it.name}</span>

                  {isEditing ? (
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      autoFocus
                      value={editingPrice}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEditingPrice(e.target.value)}
                      onBlur={commitEditingPrice}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEditingPrice();
                        if (e.key === "Escape") setEditingItemId(null);
                      }}
                      className="w-24 rounded-lg bg-background px-2 py-1 text-base font-bold tabular-nums text-foreground outline-none ring-2 ring-primary/40"
                    />
                  ) : (
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="text-base font-bold tabular-nums">
                        {formatMoney(it.price, currency)}
                      </span>
                      {it.claimedBy.length > 1 && (
                        <span
                          className={`text-[11px] font-semibold tabular-nums ${
                            isMine ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}
                        >
                          {formatMoney(perHead, currency)} ea
                        </span>
                      )}
                    </div>
                  )}

                  {it.qty && it.qty > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dutchStore.splitItemIntoUnits(it.id);
                      }}
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isMine ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <SplitSquareHorizontal className="h-2.5 w-2.5" />
                      Split into {it.qty} separate
                    </button>
                  )}

                  {it.claimedBy.length > 0 && (
                    <div className="flex -space-x-2 pt-1">
                      {it.claimedBy.slice(0, 4).map((pid) => {
                        const p = people.find((x) => x.id === pid);
                        if (!p) return null;
                        return (
                          <div key={pid} className="pop-in">
                            <div
                              className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold text-white ring-2"
                              style={{
                                backgroundColor: p.color,
                                borderColor: "transparent",
                                boxShadow: `0 0 0 2px ${isMine ? "var(--primary)" : "var(--surface)"}`,
                              }}
                            >
                              {initials(p.name)}
                            </div>
                          </div>
                        );
                      })}
                      {it.claimedBy.length > 4 && (
                        <div className="grid h-6 w-6 place-items-center rounded-full bg-black/20 text-[10px] font-bold text-white">
                          +{it.claimedBy.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => dutchStore.splitRemainingEvenly()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-4 text-sm font-semibold text-primary active:scale-[0.98] transition"
          >
            <Shuffle className="h-4 w-4" />
            Split remaining evenly
          </button>

          {showAddItem ? (
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-surface p-3">
              <input
                autoFocus
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Item name"
                className="min-w-0 flex-1 rounded-xl bg-background px-3 py-2 text-sm outline-none ring-2 ring-primary/20 focus:ring-primary/40"
              />
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitNewItem()}
                placeholder="0.00"
                className="w-20 rounded-xl bg-background px-3 py-2 text-sm tabular-nums outline-none ring-2 ring-primary/20 focus:ring-primary/40"
              />
              <button
                onClick={submitNewItem}
                className="shrink-0 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground active:scale-95 transition"
              >
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddItem(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground active:scale-[0.98] transition"
            >
              <Plus className="h-4 w-4" />
              Add item
            </button>
          )}
        </div>

        {/* Sticky footer */}
        <div className="safe-bottom fixed inset-x-0 bottom-0 mx-auto max-w-[430px] border-t border-border bg-background/95 px-5 pt-3 backdrop-blur">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Your subtotal
            </span>
            <span className="text-lg font-bold tabular-nums">{formatMoney(selectedTotal, currency)}</span>
          </div>
          <Link
            to="/summary"
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
          >
            See totals
          </Link>
        </div>
      </div>
    </PhoneShell>
  );
}
