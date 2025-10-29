import { GoogleGenAI } from "@google/genai";
import { ModerationResult } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * AI Agent function to moderate user comments.
 * It classifies text as CLEAN, WARN (mildly inappropriate), or BLOCK (severe violation).
 */
export async function moderateComment(text: string): Promise<ModerationResult> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the following user comment for inappropriate content. Classify it into one of three categories: 'CLEAN', 'WARN' (for borderline or mildly inappropriate language), or 'BLOCK' (for severe profanity, hate speech, or harassment). Respond with only one of these three words. Comment: "${text}"`,
        });

        const result = response.text.trim().toUpperCase();

        if (result === ModerationResult.BLOCK) {
            return ModerationResult.BLOCK;
        }
        if (result === ModerationResult.WARN) {
            return ModerationResult.WARN;
        }
        return ModerationResult.CLEAN;
    } catch (error) {
        console.error("AI Agent Moderation Error:", error);
        // Fail-safe: if moderation fails, assume the comment is clean to not block users unfairly.
        return ModerationResult.CLEAN;
    }
}
