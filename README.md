# Dutch 🧾

An interactive OCR receipt scanner that turns splitting a group bill into a 30-second tap game. Snap a photo of the receipt, tap the items you had, and get a fair, tax/tip-adjusted breakdown per person.

## Stack (all free)

- **Frontend**: TanStack Start (React + Vite + file-based router), Tailwind CSS — UI generated via Lovable, installable as a PWA
- **OCR / parsing**: Gemini API free tier — vision model prompted to return structured JSON (`[{item, price, qty}]`) directly from the receipt photo, called from a server route so the API key never reaches the client
- **State**: local client store (`src/lib/dutch-store.ts`) — no database, no backend beyond the OCR proxy
- **Hosting**: Cloudflare Pages / Vercel / Netlify free tier (Nitro build already targets Cloudflare by default)
- **Scope for v1**: pass-the-phone only (single device, no live multi-device sync)

## Core flow

1. **Capture** (`/capture`) — take or upload a photo of the receipt
2. **Parse** (`/parsing`) — send image to Gemini, get back structured JSON of items/qty/price + subtotal, tax, tip; currently loads a demo receipt (`dutchStore.loadDemoParsedReceipt`) — real OCR wiring is next
3. **Claim** (`/claim`) — items render as tappable "bubbles"; select a person, tap items to claim/split them; "Split remaining evenly" for shared items nobody claimed
4. **Summary** (`/summary`) — proportional tax/tip math already implemented in `computeTotals()`:
   `individualTotal = individualSubtotal * (billTotal / subtotal)`, per-person cards with a copy-to-clipboard breakdown

Real receipts are parsed by `POST /api/parse-receipt` (`src/routes/api.parse-receipt.ts`), a server route that calls the Gemini API with the photo and a JSON-schema prompt, using `GEMINI_API_KEY` from the server environment — the key never reaches the browser. If no key is set, or parsing fails, it falls back to the demo receipt so the app never dead-ends.

## Project structure

```
dutch/
  src/
    routes/            # index (welcome), capture, parsing, claim, summary — TanStack file-based routes
    components/
      PhoneShell.tsx    # mobile-frame wrapper + Avatar component
      ui/                # shadcn/radix primitives
    lib/
      dutch-store.ts      # people, items, claims, totals — the whole app state + computeTotals()
    server.ts              # SSR entry (error-wrapped), where a Gemini OCR server route will live
  public/
    manifest.webmanifest    # PWA manifest (already configured: name, icons, theme color)
    icon-512.png
  vite.config.ts             # Lovable/TanStack config, Nitro build targets Cloudflare by default
```

## Status

- [x] UI shell — all 5 screens built and wired to local state (via Lovable)
- [x] Bill state model + proportional tax/tip math (`src/lib/dutch-store.ts`)
- [x] PWA manifest + icons
- [x] Real Gemini OCR integration (`/api/parse-receipt` server route, wired into `/parsing`, with demo fallback)
- [x] `.env` / `GEMINI_API_KEY` wiring (`.env.example` — copy to `.env` and add your key)
- [ ] Service worker / offline shell (`vite-plugin-pwa` or Nitro equivalent)
- [ ] Deploy to free hosting

## Running locally

This project uses **bun** (see `bun.lock`, `bunfig.toml`):

```bash
bun install
bun run dev
```

## Open questions

- Where do people's names/avatars come from — typed in manually before claiming (current UI: add-on-the-fly via the "+" chip in the people tray)?
- Should "Split Remaining" divide only among people who already claimed *something*, or everyone in the session? (currently: splits across everyone in `state.people`)
- Any preference for how tip is entered if it's not itemized/printed on the receipt (e.g. no tip line yet because it's added after)?
