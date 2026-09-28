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

    // Helper: Execute with retry on 503 high-demand spikes
    const executeWithRetry = async (modelName: string, attempts = 3, delayMs = 1200) => {
      for (let i = 0; i < attempts; i++) {
        try {
          return await ai.models.generateContent({
            model: modelName,
            ...requestPayload
          });
        } catch (err: any) {
          const isDemandSpike = err?.message?.includes('503') || err?.message?.includes('high demand') || err?.status === 503;
          if (isDemandSpike && i < attempts - 1) {
            console.warn(`[Gemini 503] Spiked demand on ${modelName}. Retrying in ${delayMs}ms (Attempt ${i + 1}/${attempts})...`);
            await new Promise((res) => setTimeout(res, delayMs));
            delayMs *= 1.5;
          } else {
            throw err;
          }
        }
      }
    };

    let response;
    try {
      response = await executeWithRetry('gemini-3.8-flash');
    } catch (primaryErr: any) {
      console.warn('[Gemini Failover] Primary model unavailable, routing to gemini-3-flash fallback...');
      try {
        response = await executeWithRetry('gemini-3-flash');
      } catch (fallbackErr) {
        throw primaryErr;
      }
    }

    const outputText = response?.text;
    if (!outputText) {
      return NextResponse.json(
        { error: 'Vision model completed without output text.' }, 
        { status: 422 }
      );
    }

    return NextResponse.json(JSON.parse(outputText));

  } catch (error: any) {
    console.error('[Gemini Route Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Vision analysis temporarily unavailable due to upstream demand.' }, 
      { status: 503 }
    );
  }
}