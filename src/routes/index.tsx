import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dutch — Split the bill in a tap" },
      { name: "description", content: "Snap the receipt. Tap what's yours. Done. Dutch turns splitting a restaurant check into a fast, tappable game." },
      { property: "og:title", content: "Dutch — Split the bill in a tap" },
      { property: "og:description", content: "Snap the receipt. Tap what's yours. Done." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <PhoneShell>
      <div className="safe-top flex flex-1 flex-col items-center justify-between px-6 pb-6">
        <div className="mt-16 flex flex-col items-center">
          <div
            className="grid h-24 w-24 place-items-center rounded-[28px] shadow-lg shadow-primary/30"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <span className="text-5xl font-black text-primary-foreground">d</span>
          </div>
          <h1 className="mt-8 text-5xl font-black tracking-tight">Dutch</h1>
          <p className="mt-4 max-w-[280px] text-center text-lg leading-snug text-muted-foreground">
            Snap the receipt. <br />
            Tap what's yours. <br />
            <span className="text-foreground font-semibold">Done.</span>
          </p>
        </div>

        <div className="w-full space-y-3 safe-bottom">
          <Link
            to="/capture"
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
          >
            Get Started
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            No accounts. No math. No awkward Venmo requests.
          </p>
        </div>
      </div>
    </PhoneShell>
  );
}
