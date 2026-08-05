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

// Real phone photos are routinely 3-10MB, which is well past what a
// serverless function body limit (and Gemini's own request size) can take
// comfortably. Downscale + re-encode as JPEG client-side before upload so
// parsing actually gets attempted instead of silently failing on payload size.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

async function resizeImageToDataUrl(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } catch {
    // Fallback for browsers without createImageBitmap/canvas support: use the
    // original file as-is rather than blocking capture entirely.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

function Capture() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const onFile = async (file: File | null) => {
    if (!file) return;
    const dataUrl = await resizeImageToDataUrl(file);
    dutchStore.setReceipt(dataUrl);
    navigate({ to: "/parsing" });
  };

  const skipDemo = () => {
    dutchStore.setReceipt("");
    navigate({ to: "/parsing" });
  };

  return (
    <PhoneShell>
      <div className="safe-top flex flex-1 flex-col px-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="grid h-10 w-10 place-items-center rounded-full bg-surface"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Link>
          <span className="text-sm font-medium text-muted-foreground">New split</span>
          <div className="h-10 w-10" />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <button
            onClick={() => cameraRef.current?.click()}
            aria-label="Take photo of receipt"
            className="grid h-28 w-28 place-items-center rounded-full bg-primary shadow-lg shadow-primary/30 ring-8 ring-primary/10 active:scale-95 transition"
          >
            <Camera className="h-11 w-11 text-primary-foreground" />
          </button>
          <p className="mt-2 text-lg font-semibold">Take a photo of the receipt</p>
          <p className="max-w-[240px] text-sm text-muted-foreground">
            Make sure it's well lit and laid flat so every item is easy to read.
          </p>
        </div>

        <div className="safe-bottom space-y-3 pb-2">
          <button
            onClick={() => galleryRef.current?.click()}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-surface text-base font-semibold active:scale-[0.98] transition-transform"
          >
            <ImagePlus className="h-5 w-5" />
            Choose from gallery
          </button>
          <button
            onClick={skipDemo}
            className="w-full rounded-2xl py-3 text-sm font-medium text-muted-foreground active:scale-[0.98] transition"
          >
            Continue with demo receipt →
          </button>

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
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
