import { StateGraph, END } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { supabase } from '../db/supabaseClient.js';

// --- IMPORT ARCHITECTURE ---
// Using named imports to ensure functions are recognized correctly by the Node.js runtime
import { processResume } from '../services/parsing.service.js';
import { detectFraud } from '../services/fraud.service.js';
import { performVerification } from '../services/verification.service.js';
import { calculateScore } from '../services/scoring.service.js';

// --- NODE 1: PARSING AGENT ---
async function parseNode(state) {
    console.log("🔹 Step 1: Parsing Resume...");
    try {
        const result = await processResume({
            candidateId: state.candidateId,
            jobId: state.jobId
        });

        // Sync structured profile and raw text for the Intelligence Object
        await supabase
            .from('candidate_profiles')
            .update({
                raw_text: result.rawText,
                profile_json: result.structuredProfile
            })
            .eq('candidate_id', state.candidateId);

        return {
            structuredProfile: result.structuredProfile,
            rawText: result.rawText,
            status: "PARSED"
        };
    } catch (error) {
        console.error("Parsing Node Error:", error.message);
        return { errors: [`Parsing Failed: ${error.message}`], status: "FAILED" };
    }
}

// --- NODE 2: FRAUD DETECTION AGENT ---
async function fraudNode(state) {
    console.log(`🔹 Step 2: Running Fraud Detection for ${state.candidateId}...`);
    try {
        const result = await detectFraud(
            state.structuredProfile,
            state.rawText,
            state.candidateId,
            state.jobId
        );

        // Map findings to candidate_risk schema
        const riskData = {
            candidate_id: state.candidateId,
            fraud_score: Math.round(result.fraudScore || 0),
            flags: Array.isArray(result.flags) ? result.flags : [],
            risk_json: {
                ...result.details,
                duplicateDetected: result.flags?.includes("DUPLICATE_APPLICATION_DETECTED"),
                timestamp: new Date().toISOString()
            }
        };

        await supabase.from('candidate_risk').upsert(riskData, { onConflict: 'candidate_id' });

        // Update Audit Trail for UI transparency
        await supabase.from('candidate_audit_logs').insert([{
            candidate_id: state.candidateId,
            step: 'FRAUD_CHECK',
            status: result.fraudScore > 75 ? 'WARNING' : 'OK',
            details: riskData.risk_json
        }]);

        return {
            ...state,
            fraudResult: result,
            fraudScore: result.fraudScore,
            status: "FRAUD_CHECKED"
        };
    } catch (error) {
        console.error("Fraud Node Error:", error.message);
        return { ...state, status: "FAILED", errors: [error.message] };
    }
}

// --- NODE 3: VERIFICATION AGENT ---
async function verificationNode(state) {
    console.log("🔹 Step 3: Verifying Data...");
    // Verification is disabled by default per project requirements
    if (!state.verificationEnabled) {
        return { verificationResult: { enabled: false, checksAttempted: [], trustScore: 0 } };
    }

    const result = await performVerification(state.structuredProfile);
    return { verificationResult: result };
}

// --- NODE 4: SCORING & RANKING AGENT ---
async function scoringNode(state) {
    if (!state.structuredProfile) return { ...state, status: "FAILED" };
    console.log(`🔹 Step 4: Finalizing Scoring & Ranking for ${state.candidateId}...`);

    try {
        // 1. Calculate base skill-based scores & Explainability
        const scoreBreakdown = await calculateScore(state.structuredProfile, state.jobId);

        // 2. Access fraud results with strict fallback
        const fraudResult = state.fraudResult || { fraudScore: 0, flags: [], details: {} };
        const hasDuplicateFlag = fraudResult.flags?.includes("DUPLICATE_APPLICATION_DETECTED");

        // 3. APPLY MATCH PENALTY & RANKING FORMULA
        // formula: finalRankScore = overallScore - (fraudScore * 0.35) + priorityBonus
        let baseScore = Number(scoreBreakdown.overallScore) || 0;
        let fraudImpact = Number(fraudResult.fraudScore || 0) * 0.35;

        // Priority logic implementation
        let priorityBonus = state.priority === "high" ? 10 : state.priority === "medium" ? 5 : 0;

        let finalRankScore = baseScore - fraudImpact + priorityBonus;

        // Force Hard Cap for Duplicates
        if (hasDuplicateFlag) {
            finalRankScore = 15;
            console.warn(`🚩 DUPLICATE DETECTED: Hard capping score to 15% for ${state.candidateId}`);
        }

        const clampedRank = Math.round(Math.max(0, Math.min(100, finalRankScore)));

        // [Image of a flowchart showing a scoring agent calculating a final rank by subtracting a weighted fraud score from a job - match score]

        // 4. PARALLEL DB SYNC
        const syncResults = await Promise.allSettled([
            // A. Update Main Leaderboard Rank in 'candidates' table
            supabase.from('candidates').update({
                priority_score: clampedRank,
                status: 'PROCESSED'
            }).eq('id', state.candidateId),

            // B. FIX: Align with your specific schema (id, candidate_id, scores_json)
            supabase.from('candidate_scores').upsert([{
                candidate_id: state.candidateId,
                scores_json: {
                    skillMatchScore: scoreBreakdown.skillMatchScore,
                    experienceRelevanceScore: scoreBreakdown.experienceRelevanceScore,
                    educationFitScore: scoreBreakdown.educationFitScore,
                    overallScore: scoreBreakdown.overallScore,
                    explainability: scoreBreakdown.explainability, // Mandatory 3-6 bullets
                    finalRankScore: clampedRank,
                    fraudPenaltyApplied: hasDuplicateFlag
                }
            }], { onConflict: 'candidate_id' }),

            // C. Log Final Step in Audit Trail
            supabase.from('candidate_audit_logs').insert([{
                candidate_id: state.candidateId,
                step: 'SCORING_COMPLETE',
                status: hasDuplicateFlag ? 'FRAUD_ALERT' : 'SUCCESS',
                details: {
                    finalScore: clampedRank,
                    isDuplicate: hasDuplicateFlag,
                    timestamp: new Date().toISOString()
                }
            }])
        ]);

        // 🔍 Detailed Error Logging
        syncResults.forEach((res, i) => {
            if (res.status === 'rejected') {
                console.error(`❌ DB Sync Task ${i} Failed (Network/Code):`, res.reason);
            } else if (res.value.error) {
                console.error(`❌ Supabase Error in Task ${i}:`, res.value.error.message);
                console.error(`Payload Trace for Task ${i}:`, res.value.error.details);
            } else {
                console.log(`✅ DB Sync Task ${i} Successful`);
            }
        });

        return {
            ...state,
            finalRank: clampedRank,
            evaluation: scoreBreakdown,
            status: "DONE"
        };
    } catch (error) {
        console.error("Critical Error in Scoring Node:", error.message);
        return { ...state, status: "FAILED", errors: [error.message] };
    }
}

// --- WORKFLOW GRAPH CONSTRUCTION ---

function shouldContinue(state) {
    if (state.status === "FAILED") return END;
    return "fraud_detector";
}

const workflow = new StateGraph({ channels: AgentState });

// Registering specialist nodes
workflow.addNode("parser", parseNode);
workflow.addNode("fraud_detector", fraudNode);
workflow.addNode("verifier", verificationNode);
workflow.addNode("scorer", scoringNode);

// Defining graph transitions
workflow.setEntryPoint("parser");
workflow.addConditionalEdges("parser", shouldContinue);
workflow.addEdge("fraud_detector", "verifier");
workflow.addEdge("verifier", "scorer");
workflow.addEdge("scorer", END);

export const resumeGraph = workflow.compile();