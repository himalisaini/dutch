import type { ReactNode } from "react";

export function PhoneShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className={`mx-auto flex min-h-screen w-full max-w-[430px] flex-col ${className}`}>
        {children}
      </div>
    </div>
  );
}

export function Avatar({
  name,
  color,
  size = 36,
  ring = false,
  initials: init,
}: {
  name: string;
  color: string;
  size?: number;
  ring?: boolean;
  initials?: string;
}) {
  const label =
    init ??
    name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full text-white font-semibold ${
        ring ? "ring-4 ring-primary/30" : ""
      }`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.38,
      }}
      aria-label={name}
    >
      {label}
    </div>
  );
}
