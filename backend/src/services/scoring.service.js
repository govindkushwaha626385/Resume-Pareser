import { supabase } from '../db/supabaseClient.js';

/**
 * Helper: Normalize text for robust matching across agents
 */
const cleanText = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

/**
 * MANDATORY: Named export for the Scoring Agent (Step 4 in Pipeline)
 * Calculates the 50/35/15 weighted score and 3-6 explainability bullets.
 */
export const calculateScore = async (candidateProfile, jobId) => {
    // 1. Fetch Job Requirements from Database
    const { data: job, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

    if (error || !job) {
        throw new Error("Target Job ID not found for scoring.");
    }

    let explainability = [];
    let skillScore = 0;
    let expScoreVal = 0;
    let eduScoreVal = 0;

    // --- A. SKILL MATCH SCORING (50% Weight) ---
    const candidateSkills = new Set(
        (candidateProfile.skills || []).map(cleanText)
    );

    const mustHave = job.must_have_skills || [];
    const goodToHave = job.good_to_have_skills || [];

    if (mustHave.length > 0) {
        const matchedMustHave = mustHave.filter(skill => 
            candidateSkills.has(cleanText(skill))
        );
        
        skillScore = (matchedMustHave.length / mustHave.length) * 100;
        explainability.push(`Matched ${matchedMustHave.length} out of ${mustHave.length} mandatory skills.`);

        if (matchedMustHave.length < mustHave.length) {
            const missing = mustHave.filter(skill => !candidateSkills.has(cleanText(skill)));
            explainability.push(`Missing critical domain skills: ${missing.join(', ')}.`);
        }
    } else {
        skillScore = 100;
    }

    // Bonus logic for Good-to-Have skills (+15 bonus capped at 100)
    const matchedBonus = goodToHave.filter(skill => 
        candidateSkills.has(cleanText(skill))
    );

    if (matchedBonus.length > 0) {
        skillScore = Math.min(100, skillScore + 15);
        explainability.push(`Awarded bonus for ${matchedBonus.length} preferred technical skills.`);
    }

    // --- B. EXPERIENCE RELEVANCE (35% Weight) ---
    let totalYears = 0;
    const experienceList = candidateProfile.experience || [];

    experienceList.forEach(role => {
        if (role.startDate) {
            const start = new Date(role.startDate);
            const end = (!role.endDate || role.endDate.toLowerCase() === 'present') 
                ? new Date() 
                : new Date(role.endDate);

            if (!isNaN(start) && !isNaN(end)) {
                const years = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
                if (years > 0) totalYears += years;
            }
        }
    });

    const minExp = job.min_exp_years || 0;

    if (totalYears >= minExp) {
        expScoreVal = 100;
        explainability.push(`Professional tenure (${totalYears.toFixed(1)} years) satisfies role seniority.`);
    } else {
        expScoreVal = minExp > 0 ? (totalYears / minExp) * 100 : 100;
        explainability.push(`Tenure of ${totalYears.toFixed(1)} years is currently below the preferred ${minExp} years.`);
    }

    // --- C. EDUCATION FIT (15% Weight) ---
    const educationText = JSON.stringify(candidateProfile.education || "").toLowerCase();
    const degrees = ["bachelor", "master", "b.tech", "b.sc", "m.sc", "phd", "degree", "diploma", "mca", "bca"];
    
    const hasDegree = degrees.some(keyword => educationText.includes(keyword));

    if (hasDegree) {
        eduScoreVal = 100;
        explainability.push("Academic background aligns with required qualifications.");
    } else {
        eduScoreVal = 50;
        explainability.push("Alternative academic background detected; applying partial credit.");
    }

    // --- D. FINAL AGGREGATION ---
    const overallScore = Math.round(
        (skillScore * 0.50) + 
        (expScoreVal * 0.35) + 
        (eduScoreVal * 0.15)
    );
  
    console.log("----------- Logs in Scoring.service.js file -----------")
    console.log("skillMatch Score : ", Math.round(skillScore))
    console.log("experienceRelevance Score: ", Math.round(expScoreVal))
    console.log("educationFit Score : ", Math.round(eduScoreVal))
    console.log("Overall Score : ", overallScore)
    console.log("explainability : ", explainability)

    console.log("-------------------------------------------------------")

    return {
        skillMatchScore: Math.round(skillScore),
        experienceRelevanceScore: Math.round(expScoreVal),
        educationFitScore: Math.round(eduScoreVal),
        overallScore: overallScore,
        explainability: explainability // Mandatory 3-6 bullets
    };
};

/**
 * Reporting Service (Reporting Agent - Page 15)
 * Aggregates intelligence from all tables (Profiles, Scores, Risk, Audit).
 */
export const getCandidateReport = async (candidateId) => {
    try {
        const { data: candidate, error: candidateError } = await supabase
            .from('candidates')
            .select('*')
            .eq('id', candidateId)
            .single();

        if (candidateError || !candidate) {
            throw new Error("Candidate record not found.");
        }

        const [profileRes, scoresRes, riskRes, auditRes, resumeRes] = await Promise.all([
            supabase.from('candidate_profiles').select('profile_json').eq('candidate_id', candidateId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('candidate_scores').select('scores_json').eq('candidate_id', candidateId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('candidate_risk').select('fraud_score, flags, risk_json').eq('candidate_id', candidateId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('candidate_audit_logs').select('step, status, created_at').eq('candidate_id', candidateId).order('created_at', { ascending: true }),
            candidate.resume_file_path ? supabase.storage.from('resumes').createSignedUrl(candidate.resume_file_path, 3600) : Promise.resolve({ data: null })
        ]);

        const profileData = profileRes.data?.profile_json || {};
        const scoreBlock = scoresRes.data?.scores_json || {}; 
        const riskData = riskRes.data || {};
        const finalRank = candidate.priority_score || scoreBlock.finalRankScore || 0;

        let recommendation = "HOLD";
        const fraudScore = riskData.fraud_score || 0;
        
        if (candidate.status === 'SHORTLISTED' || (finalRank >= 75 && fraudScore < 40)) {
            recommendation = "PROCEED";
        } else if (candidate.status === 'REJECTED' || (finalRank < 40 || fraudScore > 60)) {
            recommendation = "REJECT";
        }

        return {
            candidateId,
            jobId: candidate.job_id,
            status: candidate.status,
            recommendation,
            resumeUrl: resumeRes.data?.signedUrl || null,
            parsing: { parsed: !!profileData.name, fieldsExtracted: Object.keys(profileData) },
            fraud: {
                fraudScore: Math.round(fraudScore),
                flags: riskData.flags || ["NONE"],
                risk_json: riskData.risk_json || {}
            },
            evaluation: {
                skillMatchScore: scoreBlock.skillMatchScore || 0,
                experienceRelevanceScore: scoreBlock.experienceRelevanceScore || 0,
                educationFitScore: scoreBlock.educationFitScore || 0,
                overallScore: finalRank,
                explainability: scoreBlock.explainability || [] //
            },
            profile: profileData,
            scores: { ...scoreBlock, overallScore: finalRank },
            risk: riskData,
            auditTrail: auditRes.data || [] //
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