import { GoogleGenAI } from '@google/genai';

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

async function compressImage(base64Str: string, maxWidth = 1024): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality JPEG
    };
  });
}

export async function parseReceiptImage(base64Image: string): Promise<ParsedReceipt | null> {
  if (!API_KEY) {
    console.warn('VITE_GEMINI_API_KEY is missing. OCR skipped.');
    return null;
  }

  try {
    // บีบอัดรูปภาพก่อนส่งขึ้น API เพื่อลดปริมาณการใช้ Data และความไวในการประมวลผล
    const compressedBase64 = await compressImage(base64Image);

    // เริ่มการใช้งาน Google Gemini AI
    const ai = new GoogleGenAI({ apiKey: API_KEY, apiVersion: 'v1' });

    // ตรวจสอบและจัดการ Mime Type ของรูปภาพ
    const mimeRegex = /^data:([^;]+);base64,/;
    const mimeMatch = mimeRegex.exec(compressedBase64);
    let mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    let base64Data = compressedBase64.replace(mimeRegex, '');

    if (base64Data.startsWith('UklG') && mimeType === 'image/jpeg') {
      mimeType = 'image/webp';
    }

    // ส่ง Prompt และรูปภาพให้ Gemini วิเคราะห์
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: OCR_PROMPT },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
    });

    const text = result.text;
    if (!text) return null;

    // แปลงข้อความที่ได้รับจาก AI (ซึ่งเป็น JSON String) ให้เป็น Object
    const jsonStr = text.replaceAll('```json', '').replaceAll('```', '').trim();
    const parsed = JSON.parse(jsonStr) as ParsedReceipt;

    // ส่งคืนข้อมูลที่สกัดออกมา พร้อมค่า Default เผื่อกรณีข้อมูลไม่ครบ
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
