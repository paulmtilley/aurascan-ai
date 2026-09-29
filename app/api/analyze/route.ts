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

    // Supported current-generation targets
    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-3.1-pro-preview'
    ];

    let lastError: any = null;
    let outputText: string | null = null;

    for (const modelName of candidateModels) {
      // Allow up to 2 attempts per valid model to handle transient 503 spikes
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            ...requestPayload
          });

          if (response?.text) {
            outputText = response.text;
            break;
          }
        } catch (err: any) {
          lastError = err;
          const isSpike = err?.message?.includes('503') || err?.status === 503;
          if (isSpike && attempt < 2) {
            await new Promise((res) => setTimeout(res, 1200));
            continue;
          }
          break; // Move to the next candidate model
        }
      }

      if (outputText) break;
    }

    if (!outputText) {
      throw lastError || new Error('Unable to complete visual analysis at this moment.');
    }

    return NextResponse.json(JSON.parse(outputText));

  } catch (error: any) {
    console.error('[Gemini Pipeline Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Vision analysis unavailable.' }, 
      { status: 500 }
    );
  }
}