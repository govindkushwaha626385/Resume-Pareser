import { supabase } from '../db/supabaseClient.js';

/**
 * Reporting Service (Reporting Agent - Page 15)
 * Aggregates multi-agent intelligence from all tables into one structured object.
 */
export const getCandidateReport = async (candidateId) => {
    try {
        // 1. Fetch Basic Candidate Entry
        const { data: candidate, error: candidateError } = await supabase
            .from('candidates')
            .select('*')
            .eq('id', candidateId)
            .single();

        if (candidateError || !candidate) {
            throw new Error("Candidate not found in master records.");
        }

        // 2. Parallel Execution for Related Agent Data (High Efficiency)
        const [profileRes, scoresRes, riskRes, auditRes, resumeRes] = await Promise.all([
            // Get the latest structured profile
            supabase.from('candidate_profiles').select('profile_json').eq('candidate_id', candidateId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
            
            // FIX: Select scores_json to access the nested explainability array
            supabase.from('candidate_scores').select('scores_json').eq('candidate_id', candidateId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
            
            // Get fraud flags and risk metadata
            supabase.from('candidate_risk').select('fraud_score, flags, risk_json').eq('candidate_id', candidateId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
            
            // Get chronological audit history
            supabase.from('candidate_audit_logs').select('step, status, created_at').eq('candidate_id', candidateId).order('created_at', { ascending: true }),
            
            // Generate a secure link for the resume file
            candidate.resume_file_path ? supabase.storage.from('resumes').createSignedUrl(candidate.resume_file_path, 3600) : Promise.resolve({ data: null })
        ]);

        const profileData = profileRes.data?.profile_json || {};
        const scoreBlock = scoresRes.data?.scores_json || {}; // Extracting from the JSONB column
        const riskData = riskRes.data || {};
        
        // Priority Score from candidates table is the "Final Rank" after fraud penalties
        const finalRank = candidate.priority_score || scoreBlock.finalRankScore || 0;

        // 3. Logic for Recommendation (Mapping to PROCEED/HOLD/REJECT)
        let recommendation = "HOLD";
        const fraudScore = riskData.fraud_score || 0;
        
        if (candidate.status === 'SHORTLISTED' || (finalRank >= 75 && fraudScore < 40)) {
            recommendation = "PROCEED";
        } else if (candidate.status === 'REJECTED' || (finalRank < 40 || fraudScore > 60)) {
            recommendation = "REJECT";
        }

        // 4. Return the Final Intelligence Object (Reporting Agent - Page 15)
        return {
            candidateId,
            jobId: candidate.job_id,
            status: candidate.status,
            recommendation,
            resumeUrl: resumeRes.data?.signedUrl || null,
            
            parsing: {
                parsed: !!profileData.name,
                fieldsExtracted: Object.keys(profileData)
            },

            fraud: {
                fraudScore: Math.round(fraudScore),
                flags: riskData.flags || ["NONE"],
                risk_json: riskData.risk_json || {}
            },

            // AI Evaluation & Explainability (Mandatory - Page 14)
            evaluation: {
                skillMatchScore: scoreBlock.skillMatchScore || 0,
                experienceRelevanceScore: scoreBlock.experienceRelevanceScore || 0,
                educationFitScore: scoreBlock.educationFitScore || 0,
                overallScore: finalRank,
                explainability: scoreBlock.explainability || [] // Successfully pulling from nested JSON
            },

            profile: profileData,
            scores: { ...scoreBlock, overallScore: finalRank },
            risk: riskData,
            auditTrail: auditRes.data || [] 
        };

    } catch (error) {
        console.error("Report Generation Error:", error);
        throw error;
    }
};

/**
 * Job Leaderboard Service (Ranking Agent - Page 15)
 */
export const getJobLeaderboard = async (jobId) => {
    try {
        const { data: candidates, error } = await supabase
            .from('candidates')
            .select(`
                id, 
                status, 
                priority_score,
                created_at,
                candidate_profiles ( profile_json, created_at )
            `)
            .eq('job_id', jobId);

        if (error) throw new Error(error.message);

        const leaderboard = (candidates || []).map(c => {
            const latestProfile = c.candidate_profiles?.length > 0 
                ? [...c.candidate_profiles].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] 
                : null;
            
            const profileData = latestProfile?.profile_json || {};

            return {
                candidateId: c.id,
                name: profileData.name || "Unknown Candidate",
                email: profileData.email || "N/A",
                status: c.status,
                score: Math.round(c.priority_score || 0), 
                rankScore: c.priority_score || 0,
                skills: Array.isArray(profileData.skills) ? profileData.skills.slice(0, 5) : [],
                uploadedAt: new Date(c.created_at).toLocaleDateString()
            };
        });

        return leaderboard.sort((a, b) => b.rankScore - a.rankScore);

    } catch (error) {
        console.error("Leaderboard Service Error:", error);
        throw error;
    }
};