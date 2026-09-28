import { NextRequest, NextResponse } from 'next/server';

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
        { error: 'Missing GEMINI_API_KEY in environment variables.' }, 
        { status: 500 }
      );
    }

    const extractMimeAndData = (base64String: string) => {
      const match = base64String.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        return { mimeType: match[1], data: match[2] };
      }
      return { mimeType: 'image/jpeg', data: base64String.split(',')[1] || base64String };
    };

    const faceData = extractMimeAndData(face);
    const bodyData = extractMimeAndData(body);

    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Act as an elite personal stylist, aesthetician, and posture consultant. Analyze the two provided images (first is portrait, second is full body). Provide an objective, constructive visual appearance audit. Return ONLY JSON conforming to the requested schema. Generate a random unique scanId string.`;

    const payload = {
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: faceData.mimeType, data: faceData.data } },
          { inlineData: { mimeType: bodyData.mimeType, data: bodyData.data } }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            scanId: { type: "STRING" },
            overallScore: { type: "INTEGER" },
            archetype: { type: "STRING" },
            colorSeason: { type: "STRING" },
            colorUndertone: { type: "STRING" },
            teaserMessage: { type: "STRING" }
          },
          required: ["scanId", "overallScore", "archetype", "colorSeason", "colorUndertone", "teaserMessage"]
        }
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Vision analysis failed.' }, 
      { status: 500 }
    );
  }
}