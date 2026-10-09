import { NextRequest, NextResponse } from "next/server";
import { testGeminiApiKey } from "@/server/ai/geminiClient";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey) {
      return NextResponse.json({ success: false, message: "Please provide a Gemini API Key to test." }, { status: 400 });
    }

    const result = await testGeminiApiKey(apiKey);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Failed to test key" }, { status: 500 });
  }
}
