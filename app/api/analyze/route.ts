import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export const maxDuration = 45;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { face, body } = await req.json();

    if (!face || !body) {
      return NextResponse.json(
        { error: 'Both face and body images are required.' }, 
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing GEMINI_API_KEY environment variable.' }, 
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const extractData = (str: string) => {
      const match = str.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) return { mimeType: match[1], data: match[2].trim() };
      return {
        mimeType: 'image/jpeg',
        data: (str.includes(',') ? str.split(',')[1] : str).trim()
      };
    };

    const faceData = extractData(face);
    const bodyData = extractData(body);

    const prompt = `Act as an elite personal stylist, aesthetician, and posture consultant. Analyze the two provided images (first is portrait, second is full body). Provide an objective, constructive visual appearance audit. Generate a unique random scanId string. Return ONLY valid JSON adhering strictly to the schema.`;

    const requestPayload = {
      contents: [
        prompt,
        {
          inlineData: {
            mimeType: faceData.mimeType,
            data: faceData.data
          }
        },
        {
          inlineData: {
            mimeType: bodyData.mimeType,
            data: bodyData.data
          }
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scanId: { type: Type.STRING },
            overallScore: { type: Type.INTEGER },
            archetype: { type: Type.STRING },
            colorSeason: { type: Type.STRING },
            colorUndertone: { type: Type.STRING },
            teaserMessage: { type: Type.STRING }
          },
          required: [
            'scanId',
            'overallScore',
            'archetype',
            'colorSeason',
            'colorUndertone',
            'teaserMessage'
          ]
        }
      }
    };

    // Primary and fallback models to cycle through if Google is under heavy load
    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-3.8-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-pro'
    ];

    let lastError: any = null;
    let outputText: string | null = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`[Vision API] Attempting analysis with model: ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          ...requestPayload
        });

        if (response?.text) {
          outputText = response.text;
          console.log(`[Vision API] Success using ${modelName}`);
          break; // Stop loop once we get a valid output
        }
      } catch (err: any) {
        lastError = err;
        const isSpike = err?.message?.includes('503') || err?.message?.includes('high demand') || err?.status === 503;
        console.warn(`[Vision API Warning] Model ${modelName} failed (${isSpike ? '503 Spike' : err?.message}). Trying next candidate...`);
        // Brief pause before switching to next model
        await new Promise((res) => setTimeout(res, 500));
      }
    }

    if (!outputText) {
      throw lastError || new Error('All vision model endpoints are experiencing temporary peak load.');
    }

    return NextResponse.json(JSON.parse(outputText));

  } catch (error: any) {
    console.error('[Gemini Pipeline Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Vision analysis temporarily unavailable due to upstream demand.' }, 
      { status: 503 }
    );
  }
}