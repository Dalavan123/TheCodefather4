import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

// Strict types for request and response
interface ChatRequestBody {
  fileContent: string;
  userMessage: string;
}

interface ChatResponseBody {
  answer: string;
  error?: string;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Testa först 'gemini-1.5-flash-latest', annars 'gemini-3-flash-preview' om du har tillgång
const MODEL_NAME = 'gemini-3-flash-preview';
const SYSTEM_PROMPT =
  "You are an assistant. Answer the user's questions based ONLY on the provided text content. If the answer is not in the text, say you don't know.";

export async function POST(req: NextRequest): Promise<NextResponse<ChatResponseBody>> {
  try {
    const { fileContent, userMessage } = (await req.json()) as ChatRequestBody;
    if (!fileContent || !userMessage) {
      return NextResponse.json({ answer: '', error: 'Missing fileContent or userMessage' }, { status: 400 });
    }
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ answer: '', error: 'Missing Gemini API key' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_PROMPT,
    });

    const prompt = `Context:\n${fileContent}\n\nUser: ${userMessage}`;
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });
    const answer = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "I don't know.";
    return NextResponse.json({ answer });
  } catch (error: any) {
    return NextResponse.json({ answer: '', error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
