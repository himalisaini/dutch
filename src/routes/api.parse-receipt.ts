import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const GEMINI_MODEL = "gemini-2.5-flash-lite";

const PROMPT = `You are a receipt-parsing engine. Look at the photo of a restaurant receipt — it may be in ANY language and ANY currency — and extract its contents as strict JSON, matching this shape exactly:

{
  "items": [{ "name": string, "price": number, "qty": number }],
  "subtotal": number,
  "tax": number,
  "tip": number,
  "currency": string
}

Rules:
- One entry per line item. If a line has qty > 1 (e.g. "House Red x2"), keep it as ONE item with that qty and the TOTAL price for that line (not per-unit).
- "price" is always the total price for that line, as a plain number (no currency symbols, no thousands separators).
- Translate every "name" into natural, concise English, regardless of what language the receipt is printed in. Do not transliterate — translate the meaning (e.g. "牛肉面" -> "Beef Noodle Soup", not "Niu Rou Mian").
- "currency" is the ISO 4217 three-letter code for the currency printed on the receipt (e.g. "USD", "EUR", "INR", "JPY", "GBP"). Infer it from the currency symbol, the language, or the country/address on the receipt. If you truly cannot tell, use "USD".
- If tax isn't printed on the receipt, set "tax" to 0. Same for "tip". Recognize local equivalents (VAT, GST, service charge, consumption tax, etc.) as "tax"/"tip" as appropriate.
- If "subtotal" isn't printed, compute it as the sum of all item prices.
- Do not include the tax, tip, or total lines as items.
- Respond with ONLY the JSON object, no markdown fences, no commentary — and make sure every string value in the JSON is in English.`;

// Reads keys from GEMINI_API_KEYS and/or GEMINI_API_KEY — either may hold a
// single key or a comma-separated list. Tried in order; on failure (rate
// limit, quota, bad key) the next one is tried automatically.
function getApiKeys(): string[] {
  const raw = [process.env.GEMINI_API_KEYS, process.env.GEMINI_API_KEY].filter(Boolean).join(",");
  return [...new Set(raw.split(",").map((k) => k.trim()).filter(Boolean))];
}

async function callGemini(apiKey: string, mimeType: string, base64Data: string): Promise<Response> {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: PROMPT }, { inlineData: { mimeType, data: base64Data } }],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );
}

export const Route = createFileRoute("/api/parse-receipt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKeys = getApiKeys();
        if (apiKeys.length === 0) {
          return Response.json(
            { error: "No Gemini API key configured (set GEMINI_API_KEY or GEMINI_API_KEYS on the server)." },
            { status: 500 },
          );
        }

        const body = (await request.json().catch(() => null)) as { imageDataUrl?: string } | null;
        const imageDataUrl = body?.imageDataUrl;
        if (!imageDataUrl || !imageDataUrl.startsWith("data:")) {
          return Response.json({ error: "imageDataUrl (data: URL) is required." }, { status: 400 });
        }

        const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) {
          return Response.json({ error: "imageDataUrl must be a base64 data URL." }, { status: 400 });
        }
        const [, mimeType, base64Data] = match;

        let geminiRes: Response | null = null;
        let lastErrorDetail = "";
        for (const apiKey of apiKeys) {
          const res = await callGemini(apiKey, mimeType, base64Data);
          if (res.ok) {
            geminiRes = res;
            break;
          }
          lastErrorDetail = `${res.status}: ${await res.text().catch(() => "")}`;
        }

        if (!geminiRes) {
          return Response.json(
            { error: `All Gemini API keys failed. Last error: ${lastErrorDetail.slice(0, 300)}` },
            { status: 502 },
          );
        }

        const geminiJson = (await geminiRes.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          return Response.json({ error: "Gemini returned no content." }, { status: 502 });
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          return Response.json({ error: "Gemini response was not valid JSON.", raw: text }, { status: 502 });
        }

        return Response.json(parsed);
      },
    },
  },
});
