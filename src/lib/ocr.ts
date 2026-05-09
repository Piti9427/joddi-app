import { GoogleGenerativeAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export type ParsedReceipt = {
  merchant: string;
  amount: number;
  date: string;
  category: string;
  confidence: number;
};

const OCR_PROMPT = `
Extract data from this Thai bank slip image. 
Return only a JSON object with these fields:
- merchant: The receiver name or shop name (Thai or English)
- amount: The total amount paid (number)
- date: The transaction date in YYYY-MM-DD format
- category: One of these: Food, Transport, Bills, Shopping, Health, Travel, Misc
- confidence: A score from 0 to 1

IMPORTANT: Return ONLY valid JSON. No markdown formatting.
`;

export async function parseReceiptImage(base64Image: string): Promise<ParsedReceipt | null> {
  if (!API_KEY) {
    console.warn('VITE_GEMINI_API_KEY is missing. OCR skipped.');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Remove the data:image/xxx;base64, prefix if present
    const base64Data = base64Image.split(',')[1] || base64Image;

    const result = await model.generateContent([
      OCR_PROMPT,
      {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg',
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown blocks
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr) as ParsedReceipt;

    return {
      merchant: parsed.merchant || 'สลิป',
      amount: Number(parsed.amount) || 0,
      date: parsed.date || new Date().toISOString().split('T')[0],
      category: parsed.category || 'Misc',
      confidence: parsed.confidence || 0.5,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return null;
  }
}
