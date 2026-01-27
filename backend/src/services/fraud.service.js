import { getModel } from '../utils/modelFactory.js';
import { supabase } from '../db/supabaseClient.js';

/**
 * Fraud Detection Service
 * Validates candidate integrity and identifies duplicate applications.
 */
export const detectFraud = async (structuredProfile, rawText, candidateId, jobId) => {
    try {
        const flags = [];
        let fraudScore = 0;
        let duplicateDetected = false; // Initial state

        // --- 1. Robust Duplicate Application Check ---
        const rawEmail = structuredProfile.email || structuredProfile.contact_info?.email || "";
        const candidateEmail = rawEmail.trim().toLowerCase();

        if (candidateEmail && jobId) {
            console.log(`🔍 Checking duplicates for: ${candidateEmail} in Job: ${jobId}`);

            // Querying JSONB profile_json for the normalized email
            const { data: existingRecords, error } = await supabase
                .from('candidate_profiles')
                .select(`
            id,
            candidate_id,
            candidates!inner(job_id)
        `)
                .eq('candidates.job_id', jobId)          // Filter by Job ID in the parent table
                .neq('candidate_id', candidateId)       // Exclude current candidate
                .eq('profile_json->>email', candidateEmail); // Match email in JSONB

            if (existingRecords && existingRecords.length > 0) {
                flags.push("DUPLICATE_APPLICATION_DETECTED");
                duplicateDetected = true;

                // This triggers the RED state in the Risk Audit card
                fraudScore = 85;
                console.log(`🚩 DUPLICATE DETECTED: ${existingRecords.length} records found in profiles.`);
            }
        }

        // --- 2. Rule-Based Experience Verification ---
        // Only add penalties if a duplicate hasn't already triggered the max penalty
        const experience = structuredProfile.experience || [];
        if (experience.length > 0 && !duplicateDetected) {
            const sortedExp = [...experience].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

            for (let i = 0; i < sortedExp.length - 1; i++) {
                const currentEnd = new Date(sortedExp[i].endDate === 'Present' ? new Date() : sortedExp[i].endDate);
                const nextStart = new Date(sortedExp[i + 1].startDate);

                const gapMonths = (nextStart - currentEnd) / (1000 * 60 * 60 * 24 * 30);
                if (gapMonths > 6) {
                    flags.push(`TIMELINE_GAP_${Math.round(gapMonths)}_MONTHS`);
                    fraudScore += 10;
                }
            }
        }

        // --- 3. AI-Powered Suspicion Analysis ---
        const model = getModel(0);
        const prompt = `
    You are an HR Security Auditor. Scan this resume JSON for evidence of FRAUD or FAKE data only.
    
    CRITICAL INSTRUCTIONS:
    - DO NOT flag missing fields (e.g., "Location not provided", "No certifications").
    - DO NOT flag generic contact info (e.g., Gmail, unverified phone numbers).
    - ONLY flag actual red flags: Lorem Ipsum text, placeholder strings like "[Company Name]", 
      impossible date overlaps (e.g., working 2 full-time jobs for 5 years), or gibberish.

    Return ONLY a JSON object:
    { 
        "ai_suspicion_score": number (0-50), 
        "flag_reasons": ["string"] 
    }

    Profile Data:
    ${JSON.stringify(structuredProfile).substring(0, 4000)}
`;

        let aiResult = { ai_suspicion_score: 0, flag_reasons: [] };

        try {
            const response = await model.invoke(prompt);
            const content = typeof response === 'string' ? response : response.content;
            const jsonMatch = content.match(/\{.*\}/s);
            if (jsonMatch) {
                aiResult = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.warn("AI Fraud Analysis bypassed.");
        }

        // --- 4. Final Consolidation ---
        // Combine rule-based score with AI score
        let finalValue = Math.round(fraudScore + (aiResult.ai_suspicion_score || 0));

        if (aiResult.flag_reasons) flags.push(...aiResult.flag_reasons);

        // Clamp final score between 0-100 and ensure integer for Supabase int4
        const finalFraudScore = Math.min(100, Math.max(0, finalValue));

        return {
            fraudScore: finalFraudScore, // Clean integer for database
            flags: flags, // Mapped to the _text (array) column
            details: {
                duplicateDetected: duplicateDetected, // Explicitly return detected status
                aiScore: aiResult.ai_suspicion_score || 0,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error("Fraud Service Failure:", error);
        return {
            fraudScore: 0,
            flags: ["SYSTEM_ERROR"],
            details: {
                duplicateDetected: false,
                error: error.message
            }
        };
    }
};