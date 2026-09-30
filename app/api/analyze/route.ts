import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export const maxDuration = 45;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { face, body, priorities, stylePref, budget } = await req.json();

    if (!face || !body) {
      return NextResponse.json(
        { error: 'Both a front-facing portrait and a standing photo are required.' }, 
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
You are evaluating two uploaded images:
Image 1: Front-facing portrait
Image 2: Full-body standing photograph

Client Context:
${clientContext}

CRITICAL INITIAL VALIDATION:
Examine both images carefully before performing styling analysis.
1. Check whether Image 1 contains a clear, identifiable human face/portrait.
2. Check whether Image 2 contains an identifiable human body or standing silhouette.
3. If either image is a blank square, solid color block, abstract screenshot, meme, placeholder, or does not clearly depict a real human subject, you MUST set "isValidPhoto": false and provide a specific, polite explanation in "rejectionReason" (e.g. "We could not detect a person in your portrait image. Please upload a clear photo of yourself taken in daylight."). Leave all other fields empty or minimal.
4. If both images are valid photographs of a person, set "isValidPhoto": true, set "rejectionReason": null, and provide the complete practical guide adhering strictly to the schema.

STYLING METHODOLOGY:
- Do NOT assign any numerical beauty, appearance, or attractiveness scores.
- Ground advice in what the user already owns first.
- Connect every recommendation directly to visible lighting, angles, or clothing contrast in the supplied photos.
- Outline realistic confidence limitations.

Return ONLY valid JSON matching the schema.`;

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
            isValidPhoto: { type: Type.BOOLEAN },
            rejectionReason: { type: Type.STRING, nullable: true },
            customerName: { type: Type.STRING, nullable: true },
            suggestedDirection: { type: Type.STRING, nullable: true },
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
          required: ['isValidPhoto']
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

    const parsedResult = JSON.parse(outputText);

    // If the image fails human presence validation, return a clean 422 error
    if (parsedResult.isValidPhoto === false) {
      return NextResponse.json(
        { 
          error: parsedResult.rejectionReason || 'We could not detect a person in one or both of the uploaded photos. Please upload clear photographs taken in natural daylight.' 
        }, 
        { status: 422 }
      );
    }

    return NextResponse.json(parsedResult);

  } catch (error: any) {
    console.error('[AuraScan Engine Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Style analysis pipeline unavailable.' }, 
      { status: 500 }
    );
  }
}