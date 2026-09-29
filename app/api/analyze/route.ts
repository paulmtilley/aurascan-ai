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

    const prompt = `Act as an elite personal stylist, aesthetician, and executive image consultant. 
Analyze the two provided images (portrait and full body). 
Provide an objective, highly actionable appearance audit. 
Generate a unique random scanId string.
Adhere strictly to the requested schema, ensuring:
- Free tier summary: Aura score, archetype, seasonal color profile, and undertone evaluation.
- Detailed paid deliverables:
  1. Facial harmony metrics (jawline definition and lighting response).
  2. Hex color swatches (best enhancing colors vs colors to limit).
  3. Precise photography and grooming specifications (optimal portrait focal length, lighting Kelvin range, camera tilt, and neckline/taper demarcations).
  4. 3 distinct capsule outfits (Casual Sharp, Business Casual, Evening Occasion) using colors and silhouettes tailored to their detected profile.
  5. 4-week structured appearance protocol.
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
            scanId: { type: Type.STRING },
            overallScore: { type: Type.INTEGER },
            archetype: { type: Type.STRING },
            colorSeason: { type: Type.STRING },
            colorUndertone: { type: Type.STRING },
            teaserMessage: { type: Type.STRING },
            faceAnalysis: {
              type: Type.OBJECT,
              properties: {
                harmonyScore: { type: Type.INTEGER },
                jawlineDefinition: { type: Type.STRING },
                skinClarityNotes: { type: Type.STRING }
              },
              required: ['harmonyScore', 'jawlineDefinition', 'skinClarityNotes']
            },
            colorAnalysis: {
              type: Type.OBJECT,
              properties: {
                bestColors: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING } 
                },
                avoidColors: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING } 
                },
                recommendedJewelry: { type: Type.STRING },
                contrastLevel: { type: Type.STRING }
              },
              required: ['bestColors', 'avoidColors', 'recommendedJewelry', 'contrastLevel']
            },
            groomingAndLightingSpecs: {
              type: Type.OBJECT,
              properties: {
                focalLength: { type: Type.STRING },
                lightingKelvin: { type: Type.STRING },
                cameraAngleRecommendation: { type: Type.STRING },
                hairAndBeardDemarcation: { type: Type.STRING }
              },
              required: [
                'focalLength', 
                'lightingKelvin', 
                'cameraAngleRecommendation', 
                'hairAndBeardDemarcation'
              ]
            },
            capsuleOutfits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  setting: { type: Type.STRING },
                  paletteNote: { type: Type.STRING },
                  pieces: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  }
                },
                required: ['title', 'setting', 'paletteNote', 'pieces']
              }
            },
            glowUpPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  week: { type: Type.INTEGER },
                  focus: { type: Type.STRING },
                  actions: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  }
                },
                required: ['week', 'focus', 'actions']
              }
            }
          },
          required: [
            'scanId',
            'overallScore',
            'archetype',
            'colorSeason',
            'colorUndertone',
            'teaserMessage',
            'faceAnalysis',
            'colorAnalysis',
            'groomingAndLightingSpecs',
            'capsuleOutfits',
            'glowUpPlan'
          ]
        }
      }
    };

    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-3.8-flash-lite',
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