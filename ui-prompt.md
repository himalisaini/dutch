# UI generation prompt — Dutch

Use this prompt in whatever UI tool you're using (v0, Lovable, Galileo, etc.) to generate the UI. Export/zip the result and drop it in this project — I'll wire it up to the React + Gemini OCR logic.

---

**Prompt:**

Design a mobile-first Progressive Web App called **"Dutch"** — a bill-splitting app that turns splitting a restaurant check into a fast, tappable game. Optimize every screen for one-handed use on a phone (390×844 baseline), with generous touch targets (min 44px), rounded-corner cards, and a playful but clean aesthetic — think Cash App meets a receipt. Support both light and dark mode.

Build these 5 screens as a connected flow:

**1. Capture Screen**
- Full-screen camera viewfinder (or a large "Take Photo of Receipt" button with a receipt/camera icon if live camera isn't available in the mockup)
- Secondary "Upload from gallery" option
- Minimal chrome — this should feel instant and low-friction

**2. Parsing / Loading Screen**
- Shows the captured receipt photo with a subtle scanning animation overlay (a horizontal line sweeping down, or a shimmer)
- Status text like "Reading your receipt…" that could cycle through fun micro-copy ("Finding the fries…", "Counting the drinks…")

**3. Claiming Screen (the core screen)**
- Top: the parsed item list rendered as a grid/wrap of rounded "bubbles" — each bubble shows item name + price (e.g. "Truffle Fries · $14.00")
- Each bubble supports multiple people claiming it: when tapped, show small avatar/initials chips stacking on the bubble, and the price per person auto-splits and displays (e.g. "$7.00 each" if 2 people tapped it)
- A horizontal row/tray of "people" avatars at the top or bottom (add person with a "+" chip) that the user selects before tapping bubbles — the currently-selected person should be visually highlighted
- A prominent "Split Remaining Evenly" button for any items nobody claimed
- A running subtotal per person visible somewhere (sticky footer or expandable drawer)
- A clear "Done / See Totals" primary CTA

**4. Summary / Share Screen**
- Card per person: name/avatar, their itemized total including their proportional share of tax + tip, e.g. "Sam owes $24.50"
- Tap a person's card to reveal a "Copy breakdown" / "Send request" action
- A top summary showing total bill, tax, tip, and subtotal for context
- A "New Split" button to start over

**5. Empty/Onboarding state**
- Simple 1-screen welcome with the Dutch logo/wordmark, a one-line pitch ("Snap the receipt. Tap what's yours. Done."), and a "Get Started" CTA into the Capture screen

**Style guidance:**
- Color palette: pick one warm accent color (e.g. a coral, amber, or green — something that reads "money/food" without being a generic fintech blue) plus a neutral gray/black-and-white base
- Typography: one clean sans-serif, strong weight on prices/numbers so the math feels trustworthy at a glance
- Include a bottom-safe-area spacer / notch-safe layout since this is a PWA meant to be added to the iOS/Android home screen
- Include an app icon design (rounded square, works at 192px and 512px) and a simple splash screen concept

Deliver as exportable HTML/CSS or React components (component-per-screen), plus the icon/splash assets, so they can be dropped into a Vite + React project.

---

## Notes for when you send the zip

Once you upload it, I'll:
1. Drop the components into `src/components/`
2. Wire the Capture screen to the camera/file input
3. Wire the Claiming screen to the live bill state (real items from Gemini OCR, real people, real per-bubble split math)
4. Wire the Summary screen to the proportional tax/tip calculation
5. Extract the icon/splash into `public/` for the PWA manifest
