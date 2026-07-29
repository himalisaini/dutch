import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Copy, Send, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { PhoneShell, Avatar } from "@/components/PhoneShell";
import { dutchStore, useDutch, computeTotals, formatMoney } from "@/lib/dutch-store";

export const Route = createFileRoute("/summary")({
  head: () => ({
    meta: [
      { title: "Who owes what — Dutch" },
      { name: "description", content: "The final split. Each person's share with tax and tip, ready to send." },
      { property: "og:title", content: "Who owes what — Dutch" },
      { property: "og:description", content: "Each person's share with tax and tip." },
    ],
  }),
  component: Summary,
});

function Summary() {
  const state = useDutch((s) => s);
  const currency = state.currency;
  const nav = useNavigate();
  const { subtotal, tax, tip, total, totals } = computeTotals(state);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <PhoneShell>
      <div className="safe-top flex flex-1 flex-col px-5">
        <div className="flex items-center justify-between pt-2">
          <Link to="/claim" className="grid h-10 w-10 place-items-center rounded-full bg-surface">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-medium">Summary</span>
          <div className="h-10 w-10" />
        </div>

        <h1 className="mt-4 text-3xl font-black tracking-tight">{formatMoney(total, currency)}</h1>
        <p className="text-sm text-muted-foreground">
          Split between {totals.length} {totals.length === 1 ? "person" : "people"}
        </p>

        {/* Bill breakdown */}
        <div className="mt-4 rounded-2xl bg-surface p-4">
          <Row label="Subtotal" value={subtotal} currency={currency} />
          <Row label="Tax" value={tax} currency={currency} />
          <Row label="Tip" value={tip} currency={currency} />
          <div className="mt-2 border-t pt-2">
            <Row label="Total" value={total} currency={currency} strong />
          </div>
        </div>

        {/* Per-person cards */}
        <div className="mt-5 space-y-2.5 pb-32">
          {totals.map((t) => {
            const open = openId === t.person.id;
            return (
              <div
                key={t.person.id}
                className="overflow-hidden rounded-2xl border bg-card"
              >
                <button
                  onClick={() => setOpenId(open ? null : t.person.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <Avatar name={t.person.name} color={t.person.color} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{t.person.name} owes</div>
                    <div className="text-xs text-muted-foreground">
                      {t.items.length} {t.items.length === 1 ? "item" : "items"} · tax + tip included
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold tabular-nums">{formatMoney(t.total, currency)}</div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {open && (
                  <div className="border-t bg-surface/50 px-4 py-3">
                    <ul className="space-y-1 text-sm">
                      {t.items.map((it, i) => (
                        <li key={i} className="flex justify-between text-muted-foreground">
                          <span className="truncate pr-2">{it.name}</span>
                          <span className="tabular-nums">{formatMoney(it.share, currency)}</span>
                        </li>
                      ))}
                      <li className="flex justify-between pt-1 text-xs text-muted-foreground">
                        <span>Tax + tip</span>
                        <span className="tabular-nums">
                          {formatMoney(t.tax + t.tip, currency)}
                        </span>
                      </li>
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => copyBreakdown(t, currency)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-background px-3 py-2.5 text-sm font-medium"
                      >
                        <Copy className="h-4 w-4" /> Copy
                      </button>
                      <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground">
                        <Send className="h-4 w-4" /> Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="safe-bottom fixed inset-x-0 bottom-0 mx-auto max-w-[430px] bg-gradient-to-t from-background via-background to-transparent px-5 pt-6">
          <button
            onClick={() => {
              dutchStore.reset();
              nav({ to: "/" });
            }}
            className="flex h-14 w-full items-center justify-center rounded-2xl border-2 border-primary bg-background text-base font-semibold text-primary active:scale-[0.98] transition-transform"
          >
            New split
          </button>
        </div>
      </div>
    </PhoneShell>
  );
}

function Row({
  label,
  value,
  currency,
  strong = false,
}: {
  label: string;
  value: number;
  currency: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between py-1 text-sm ${strong ? "font-bold text-base" : ""}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{formatMoney(value, currency)}</span>
    </div>
  );
}

function copyBreakdown(
  t: {
    person: { name: string };
    items: { name: string; share: number }[];
    tax: number;
    tip: number;
    total: number;
  },
  currency: string,
) {
  const lines = [
    `${t.person.name}'s share — ${formatMoney(t.total, currency)}`,
    ...t.items.map((i) => `  ${i.name}: ${formatMoney(i.share, currency)}`),
    `  Tax + tip: ${formatMoney(t.tax + t.tip, currency)}`,
  ];
  navigator.clipboard?.writeText(lines.join("\n")).catch(() => {});
}
