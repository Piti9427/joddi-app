// @ts-nocheck
// Supabase Edge Function. Deploy with:
// supabase functions deploy smart-parse
// supabase secrets set GEMINI_API_KEY=...

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? text;
  const objectMatch = raw.match(/\{[\s\S]*\}/);
  if (!objectMatch) throw new Error('Gemini response did not contain JSON');
  return JSON.parse(objectMatch[0]);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return json({ error: 'GEMINI_API_KEY is not configured' }, 500);
  }

  const { text, categories, localResult } = await request.json().catch(() => ({}));
  if (typeof text !== 'string' || text.trim().length === 0) {
    return json({ error: 'text is required' }, 400);
  }

  const prompt = `
You parse expense tracker natural language input.
Return only strict JSON with this shape:
{
  "type": "Income" | "Expense",
  "amount": number | null,
  "category": string | undefined,
  "merchant": string | undefined,
  "note": string | undefined,
  "date": "YYYY-MM-DD" | undefined,
  "paymentMethod": "cash" | "bank" | "card" | "ewallet" | "promptpay" | undefined,
  "confidence": number,
  "needsReview": boolean
}

Rules:
- Do not invent an amount.
- Use a category from the provided categories when possible.
- Prefer Thai context when the input is Thai.
- Mark needsReview true when amount is missing or confidence is below 0.74.

Input: ${JSON.stringify(text)}
Categories: ${JSON.stringify(categories ?? [])}
Local fallback result: ${JSON.stringify(localResult ?? null)}
`;

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  if (!geminiResponse.ok) {
    return json({ error: 'Gemini request failed' }, 502);
  }

  const geminiJson = await geminiResponse.json();
  const output = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof output !== 'string') {
    return json({ error: 'Gemini returned no text' }, 502);
  }

  try {
    return json(extractJson(output));
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Invalid Gemini JSON' }, 502);
  }
});
