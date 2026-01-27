import { createRequire } from 'module';
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { supabase } from '../db/supabaseClient.js';
import { ResumeSchema } from "../schemas/resume.schema.js";
import { getModel } from '../utils/modelFactory.js';

// Setup PDF Parser (required for ES modules)
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

// Initialize AI Model and Schema Parser
const model = getModel(0);
const parser = StructuredOutputParser.fromZodSchema(ResumeSchema);

export const processResume = async (body) => {
    const { candidateId, jobId } = body;

    try {
        // 1. Get Resume File Path from Database
        const { data: candidate, error: fetchError } = await supabase
            .from('candidates')
            .select('resume_file_path')
            .eq('id', candidateId)
            .single();

        if (fetchError || !candidate) {
            throw new Error("Candidate not found.");
        }

        // 2. Download File from Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('resumes')
            .download(candidate.resume_file_path);

        if (downloadError) {
            throw new Error("Failed to download resume file.");
        }

        // 3. Extract Raw Text from PDF
        const pdfBuffer = await fileData.arrayBuffer();
        const pdfResult = await pdf(Buffer.from(pdfBuffer));
        const rawText = pdfResult.text;

        // 4. Generate Structured Data using AI
        const prompt = `
            You are an expert HR AI. Extract structured data from the resume text below.
            Refine the skills list to be concise. Format dates as YYYY-MM.
            
            CRITICAL: Output ONLY valid JSON. Do not add any conversational text.
            
            RESUME TEXT:
            ${rawText.substring(0, 20000)}
            
            ${parser.getFormatInstructions()}
        `;

        const response = await model.invoke(prompt);

        // 5. Clean and Parse JSON Output
        let structuredProfile;
        try {
            const jsonString = response.content.substring(
                response.content.indexOf('{'),
                response.content.lastIndexOf('}') + 1
            );
            
            structuredProfile = await parser.parse(jsonString);

        } catch (parseError) {
            console.error("⚠️ AI JSON Parse Failed, saving raw response instead.", parseError);
            structuredProfile = {
                error: "AI Generation Mismatch",
                raw_response: response.content
            };
        }

        // 6. Save Profile to Database (FIXED COLUMN NAME HERE)
        const { error: saveError } = await supabase
            .from('candidate_profiles')
            .insert([{
                candidate_id: candidateId,
                profile_json: structuredProfile,
                raw_text: rawText // <--- UPDATED: Was 'extracted_text', now 'raw_text'
            }]);

        if (saveError) {
            throw new Error(`Profile Save Failed: ${saveError.message}`);
        }

        // 7. Update Candidate Status
        await supabase
            .from('candidates')
            .update({ status: 'PROCESSED' })
            .eq('id', candidateId);

        // 8. Create Audit Log
        await supabase.from('candidate_audit_logs').insert([{
            candidate_id: candidateId,
            step: 'PARSE',
            status: 'OK',
            details: { fieldsExtracted: Object.keys(structuredProfile || {}) }
        }]);

        // Return Result
        return {
            candidateId,
            jobId,
            structuredProfile,
            rawText,
            parsing: {
                parsed: true,
                fieldsExtracted: Object.keys(structuredProfile || {})
            },
            status: "PROCESSED"
        };

    } catch (error) {
        console.error("Parsing Service Error:", error);
        throw error;
    }
};