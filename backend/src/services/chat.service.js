import { supabase } from '../db/supabaseClient.js';
import { getModel } from '../utils/modelFactory.js';
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

/**
 * Chat Service
 * Handles RAG (Retrieval-Augmented Generation) logic for specific resumes.
 */
export const askResumeQuestion = async (candidateId, question) => {
    try {
        // 1. Fetch Candidate's Raw Text from DB
        // We use .match() for a direct primary key string lookup
        const { data: profile, error } = await supabase
            .from('candidate_profiles')
            .select('raw_text, profile_json')
            .match({ candidate_id: candidateId })
            .maybeSingle();

        if (error || !profile) {
            console.error(`❌ Chat Lookup Failed: ${candidateId} not found in candidate_profiles.`);
            return "I'm sorry, I couldn't find the intelligence profile for this candidate. Please ensure the analysis is complete.";
        }

        // 2. Prepare Context
        // Structured JSON provides reliable facts (Education/Dates), Raw Text provides nuances.
        const context = `
            STRUCTURED DATA:
            ${JSON.stringify(profile.profile_json)}

            RESUME TEXT:
            ${profile.raw_text || "Full text not extracted."}
        `;

        // 3. Construct Prompt using LangChain Templates
        // backend/src/services/chat.service.js

        const chatPrompt = PromptTemplate.fromTemplate(`
    You are an expert HR Intelligence Assistant. 
    Analyze the candidate context and provide a CONCISE, professional answer.

    CONTEXT:
    {context}

    RECRUITER QUESTION: 
    "{question}"

    STRICT INSTRUCTIONS:
    - BREVITY: Limit your response to 2-4 sentences maximum. Use bullet points for lists.
    - NO FLUFF: Do not include introductory phrases like "Based on the resume..." or "I have analyzed..."
    - PROFESSIONALISM: Use objective, data-driven insights only.
    - RED FLAGS: Mention gaps or job-hopping only if specifically asked.
    - LIMITATION: If info is missing, say: "Information not available in profile."
    - FORMATTING: If suggesting questions, provide exactly 3 short bullet points.

    EXPERT EVALUATION (CONCISE):
`);

        // 4. Initialize AI Model (Ollama/Llama3 as per your factory)
        const model = getModel(0);
        const chain = chatPrompt.pipe(model).pipe(new StringOutputParser());

        const response = await chain.invoke({
            context: context.substring(0, 8000), // Safety truncation for context window
            question: question
        });

        return response;

    } catch (error) {
        console.error("Critical Chat Service Error:", error);
        return "I encountered a technical error while analyzing this profile. Please try refreshing the report.";
    }
};