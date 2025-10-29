import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Genre, Call } from '../types';
import { MALE_VOICES, FEMALE_VOICES } from '../constants';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function generateCallStories(genre: Genre): Promise<Omit<Call, 'id' | 'comments' | 'genre'>[]> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `Generate a list of 3 real-life-inspired 911 call scenarios for the genre: '${genre}'.
            These scenarios MUST be based on summaries of actual, publicly reported 911 calls. Adapt them for entertainment, ensuring all personal identifying information is anonymized.
            Each scenario MUST include:
            1. A short, catchy title.
            2. A one-sentence description.
            3. A short description of the caller (e.g., 'Panicked Young Male', 'Annoyed Elderly Woman', 'Confused Female'). This is the 'callerDescription'.
            4. The gender of the Operator ('Male' or 'Female'). This is the 'operatorGender'.
            5. A dialogue transcript between the 'Operator' and the 'Caller'.

            The transcript MUST mimic a natural, spontaneous conversation with realistic pauses ("..."), hesitations ("uhm"), and emotional tone indicators (e.g., "(panicked)").
            The transcript should be between 100 and 200 words.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            callerDescription: {
                                type: Type.STRING,
                                description: "A brief description of the caller, e.g., 'Panicked Young Male'."
                            },
                             operatorGender: {
                                type: Type.STRING,
                                description: "The gender of the Operator, either 'Male' or 'Female'."
                            },
                            transcript: { type: Type.STRING },
                        },
                        required: ["title", "description", "callerDescription", "operatorGender", "transcript"],
                    },
                },
            },
        });

        const jsonStr = response.text.trim();
        const generatedCalls = JSON.parse(jsonStr);
        
        if (!Array.isArray(generatedCalls)) {
            console.error("API did not return an array:", generatedCalls);
            return [];
        }

        return generatedCalls;
    } catch (error) {
        console.error("Error generating call stories:", error);
        throw new Error("Failed to generate stories from AI.");
    }
}

export async function generateCallAudio(transcript: string, callerDescription: string, operatorGender: 'Male' | 'Female'): Promise<string> {
    try {
        const operatorVoice = operatorGender === 'Male'
            ? MALE_VOICES[Math.floor(Math.random() * MALE_VOICES.length)]
            : FEMALE_VOICES[Math.floor(Math.random() * FEMALE_VOICES.length)];

        let callerVoice;
        const lowerCaseDesc = callerDescription.toLowerCase();
        if (lowerCaseDesc.includes('male') || lowerCaseDesc.includes('man') || lowerCaseDesc.includes('boy')) {
            callerVoice = MALE_VOICES[Math.floor(Math.random() * MALE_VOICES.length)];
        } else {
            callerVoice = FEMALE_VOICES[Math.floor(Math.random() * FEMALE_VOICES.length)];
        }

        const ttsPrompt = `
AI VOICE AGENT INSTRUCTION:
Your task is to perform a narration of the following 911 call transcript with absolute voice consistency and realism.
There are two speakers: 'Operator' and 'Caller'.

1.  **OPERATOR ROLE:** The 'Operator' is a ${operatorGender} 911 dispatcher. You MUST use the assigned voice ('${operatorVoice}') for ALL lines starting with 'Operator:'.
2.  **CALLER ROLE:** The 'Caller' is a ${callerDescription}. You MUST use the assigned voice ('${callerVoice}') for ALL lines starting with 'Caller:'.

**CRITICAL RULE: VOICE LOCK IS MANDATORY.**
You are to simulate two distinct individuals. The Operator is one person, and the Caller is another. Their voices MUST remain consistent for their roles throughout the entire transcript. DO NOT swap voices. DO NOT change a character's voice mid-call.

**PERFORMANCE STYLE:** The performance must be raw and authentic, like a real 'found-footage' recording, not a polished acting job. Include natural hesitations, breaths, and emotional tones as implied by the text.

TRANSCRIPT:
${transcript}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: ttsPrompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            {
                                speaker: 'Operator',
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: operatorVoice }
                                }
                            },
                            {
                                speaker: 'Caller',
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: callerVoice }
                                }
                            }
                        ]
                    }
                }
            }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating call audio:", error);
        throw new Error("Failed to generate audio from AI.");
    }
}

// Audio decoding utilities
function decode(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export async function decodeAudioData(
    base64: string,
    ctx: AudioContext,
): Promise<AudioBuffer> {
    const data = decode(base64);
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000); // 1 channel, 24000 sample rate

    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }

    return buffer;
}
