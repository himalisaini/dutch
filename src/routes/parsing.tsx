import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { dutchStore, useDutch } from "@/lib/dutch-store";

export const Route = createFileRoute("/parsing")({
  head: () => ({
    meta: [
      { title: "Reading your receipt — Dutch" },
      { name: "description", content: "Dutch is reading your receipt and pulling out every item." },
      { property: "og:title", content: "Reading your receipt — Dutch" },
      { property: "og:description", content: "Dutch is reading your receipt." },
    ],
  }),
  component: Parsing,
});

const MESSAGES = [
  "Reading your receipt…",
  "Finding the fries…",
  "Counting the drinks…",
  "Tallying the tip…",
  "Almost there…",
];

function Parsing() {
  const navigate = useNavigate();
  const receipt = useDutch((s) => s.receiptImage);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), 900);

    let cancelled = false;

    async function run() {
      if (receipt) {
        try {
          const res = await fetch("/api/parse-receipt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageDataUrl: receipt }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error ?? "Failed to parse receipt.");
          if (cancelled) return;
          dutchStore.setParsedReceipt(data);
          navigate({ to: "/claim" });
          return;
        } catch (err) {
          console.error("Receipt parsing failed, falling back to demo:", err);
        }
      }
      if (cancelled) return;
      dutchStore.loadDemoParsedReceipt();
      navigate({ to: "/claim" });
    }

    run();

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [navigate, receipt]);

  return (
    <PhoneShell>
      <div className="safe-top flex flex-1 flex-col px-6">
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Scanning</h1>
        <p className="text-sm text-muted-foreground">Hang tight for a sec.</p>

        <div className="relative mt-6 flex-1 overflow-hidden rounded-3xl border bg-surface shadow-inner">
          {receipt ? (
            <img src={receipt} alt="Your receipt" className="h-full w-full object-cover" />
          ) : (
            <FakeReceipt />
          )}
          {/* Scan overlay */}
          <div className="pointer-events-none absolute inset-0">
            <div className="scan-line absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
        </div>

        <div className="safe-bottom mt-6 flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-primary"
                style={{ animation: `pop-in 1s ease-in-out ${i * 0.15}s infinite alternate` }}
              />
            ))}
          </div>
          <p className="text-base font-medium">{MESSAGES[msgIdx]}</p>
        </div>
      </div>
    </PhoneShell>
  );
}

function FakeReceipt() {
  return (
    <div className="mx-auto h-full max-w-[280px] bg-white p-6 text-neutral-800">
      <div className="text-center">
        <div className="text-lg font-black tracking-widest">SUPPER CLUB</div>
        <div className="text-xs text-neutral-500">123 Main St · Table 7</div>
      </div>
      <div className="my-4 border-b border-dashed" />
      <div className="space-y-2 text-sm font-mono">
        {[
          ["Truffle Fries", "14.00"],
          ["Margherita Pizza", "22.00"],
          ["Caesar Salad", "16.00"],
          ["Grilled Salmon", "32.00"],
          ["Ribeye Steak", "48.00"],
          ["House Red x2", "24.00"],
          ["Sparkling Water", "6.00"],
          ["Tiramisu", "11.00"],
          ["Espresso", "4.00"],
        ].map(([n, p]) => (
          <div key={n} className="flex justify-between">
            <span>{n}</span>
            <span>{p}</span>
          </div>
        ))}
      </div>
      <div className="my-4 border-b border-dashed" />
      <div className="flex justify-between text-sm font-mono">
        <span>Subtotal</span>
        <span>177.00</span>
      </div>
    </div>
  );
}
