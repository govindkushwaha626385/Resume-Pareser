import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";

export const getModel = (temperature = 0) => {
    // Get AI provider from .env (default to 'ollama' if not set)
    const provider = process.env.AI_PROVIDER || "ollama";

    console.log(`🤖 Using AI Provider: ${provider.toUpperCase()}`);

    // Option 1: Google Gemini
    if (provider === "gemini") {
        return new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-2.0-flash", // Using the latest flash model
            temperature: temperature,
            maxOutputTokens: 17000,
        });
    }

    // Option 2: Local Ollama (Default)
    return new ChatOllama({
        baseUrl: "http://localhost:11434",
        model: "llama3",
        temperature: temperature,
    });
};

export const safeParseJSON = (text) => {
    try {
        const match = text.match(/\{[\s\S]*\}/); // Finds the first { and last }
        return match ? JSON.parse(match[0]) : null;
    } catch (e) {
        console.error("Failed to parse AI JSON:", e);
        return null;
    }
};