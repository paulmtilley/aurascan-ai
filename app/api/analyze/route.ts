import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export const maxDuration = 45;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { face, body, priorities, stylePref, budget } = await req.json();

    if (!face || !body) {
      return NextResponse.json(
        { error: 'Both face and body photographs are required.' }, 
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

    const clientContext = `
Customer Priorities: ${priorities || 'Dating profile photos and casual wardrobe'}
Preferred Style: ${stylePref || 'Relaxed, minimal patterns'}
Current Budget: ${budget || '£0 (Use what I own)'}
`;

    const prompt = `Act as an expert, pragmatic personal stylist and portrait photography consultant. 
Analyze the two supplied images (first is portrait, second is full body).
Client Context:
${clientContext}

Provide a practical, actionable styling and photography guide adhering strictly to this methodology:
1. Do NOT assign any numerical beauty, appearance, or attractiveness scores. Focus strictly on lighting, angles, clothing contrast, and silhouette coordination.
2. Ground all advice in what the user already owns first (e.g., standard dark jeans, plain tops, casual overshirts).
3. Connect each major recommendation directly to visible cues in the images (e.g., uneven lighting, low camera angles, lack of separation between shirt and skin).
4. Outline realistic confidence limitations (e.g., acknowledge lighting consistency or camera processing variations).

Return ONLY valid JSON adhering strictly to the schema.`;

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
            customerName: { type: Type.STRING },
            suggestedDirection: { type: Type.STRING },
            quickStartChanges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  desc: { type: Type.STRING }
                },
                required: ['title', 'desc']
              }
            },
            photoObservations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  observation: { type: Type.STRING },
                  why: { type: Type.STRING },
                  tryThis: { type: Type.STRING }
                },
                required: ['observation', 'why', 'tryThis']
              }
            },
            confidenceNotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            palette: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  hex: { type: Type.STRING },
                  use: { type: Type.STRING }
                },
                required: ['name', 'hex', 'use']
              }
            },
            outfits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  pieces: { type: Type.STRING },
                  why: { type: Type.STRING },
                  ownAlternative: { type: Type.STRING },
                  checkBefore: { type: Type.STRING }
                },
                required: ['title', 'pieces', 'why', 'ownAlternative', 'checkBefore']
              }
            },
            photoChecklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            finishingDetails: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            shoppingPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  priority: { type: Type.INTEGER },
                  item: { type: Type.STRING },
                  buyOnlyIf: { type: Type.STRING }
                },
                required: ['priority', 'item', 'buyOnlyIf']
              }
            },
            actionPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  task: { type: Type.STRING }
                },
                required: ['day', 'task']
              }
            }
          },
          required: [
            'suggestedDirection',
            'quickStartChanges',
            'photoObservations',
            'confidenceNotes',
            'palette',
            'outfits',
            'photoChecklist',
            'finishingDetails',
            'shoppingPlan',
            'actionPlan'
          ]
        }
      }
    };

    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite'
    ];

    let lastError: any = null;
    let outputText: string | null = null;

    for (const modelName of candidateModels) {
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
          break;
        }
      }

      if (outputText) break;
    }

    if (!outputText) {
      throw lastError || new Error('Unable to complete styling analysis at this time.');
    }

    return NextResponse.json(JSON.parse(outputText));

  } catch (error: any) {
    console.error('[AuraScan Engine Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Style analysis pipeline unavailable.' }, 
      { status: 500 }
    );
  }
}