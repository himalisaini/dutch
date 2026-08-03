import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Camera, ImagePlus, X } from "lucide-react";
import { useRef } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { dutchStore } from "@/lib/dutch-store";

export const Route = createFileRoute("/capture")({
  head: () => ({
    meta: [
      { title: "Capture Receipt — Dutch" },
      { name: "description", content: "Snap or upload a photo of your restaurant receipt to start splitting." },
      { property: "og:title", content: "Capture Receipt — Dutch" },
      { property: "og:description", content: "Snap or upload a photo of your restaurant receipt." },
    ],
  }),
  component: Capture,
});

function Capture() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const onFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      dutchStore.setReceipt(reader.result as string);
      navigate({ to: "/parsing" });
    };
    reader.readAsDataURL(file);
  };

  const skipDemo = () => {
    dutchStore.setReceipt("");
    navigate({ to: "/parsing" });
  };

  return (
    <PhoneShell className="bg-neutral-950 text-white">
      <div className="relative flex flex-1 flex-col">
        {/* Faux viewfinder */}
        <div className="relative flex-1 overflow-hidden bg-neutral-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.08),transparent_60%)]" />
          {/* Framing brackets */}
          <div className="absolute inset-x-8 top-24 bottom-40">
            <Corner className="left-0 top-0" />
            <Corner className="right-0 top-0 rotate-90" />
            <Corner className="left-0 bottom-0 -rotate-90" />
            <Corner className="right-0 bottom-0 rotate-180" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/10 backdrop-blur">
                  <Camera className="h-8 w-8" />
                </div>
                <p className="mt-4 text-sm text-white/70">Line up the receipt inside the frame</p>
              </div>
            </div>
          </div>

          {/* Top bar */}
          <div className="safe-top absolute inset-x-0 top-0 flex items-center justify-between px-4">
            <Link
              to="/"
              className="grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Link>
            <span className="text-sm font-medium text-white/80">New split</span>
            <div className="h-10 w-10" />
          </div>
        </div>

        {/* Controls */}
        <div className="safe-bottom bg-neutral-950 px-6 pt-6">
          <div className="flex items-center justify-around">
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex flex-col items-center gap-1 text-white/80"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                <ImagePlus className="h-5 w-5" />
              </div>
              <span className="text-xs">Gallery</span>
            </button>

            <button
              onClick={() => cameraRef.current?.click()}
              className="grid h-20 w-20 place-items-center rounded-full bg-primary ring-4 ring-white/20 active:scale-95 transition"
              aria-label="Take photo of receipt"
            >
              <Camera className="h-7 w-7 text-primary-foreground" />
            </button>

            <button
              onClick={() => cameraRef.current?.click()}
              className="flex flex-col items-center gap-1 text-white/80"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                <Camera className="h-5 w-5" />
              </div>
              <span className="text-xs">Camera</span>
            </button>
          </div>

          <button
            onClick={skipDemo}
            className="mt-5 w-full rounded-2xl bg-white/10 py-3 text-sm font-medium text-white/90 active:scale-[0.98] transition"
          >
            Continue with demo receipt →
          </button>

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
    </PhoneShell>
  );
}

function Corner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute h-8 w-8 border-primary ${className}`}
      style={{ borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 }}
    />
  );
}
