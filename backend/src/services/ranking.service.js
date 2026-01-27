import { supabase } from '../db/supabaseClient.js';

/**
 * Ranking Service
 * Formula: Final = Overall - (Fraud * 0.35) + PriorityBonus
 * Column Mapping: Using 'priority_score' as the leaderboard source.
 */
export const updateRank = async (candidateId, overallScore, fraudScore) => {
    try {
        // --- 1. Retry Logic for DB Sync ---
        // AI can be faster than the DB write. If lookup fails, wait 1.5s and retry once.
        let { data: candidate, error } = await supabase
            .from('candidates')
            .select('priority, name')
            .eq('id', candidateId)
            .single();

        if (error || !candidate) {
            console.warn(`⚠️ Initial lookup failed for ${candidateId}. Retrying in 1.5s...`);
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const retry = await supabase
                .from('candidates')
                .select('priority, name')
                .eq('id', candidateId)
                .single();
            
            candidate = retry.data;
            error = retry.error;
        }

        if (error || !candidate) {
            console.error(`❌ DB LOOKUP FAILED: Candidate ID ${candidateId} still not found.`);
            return 0;
        }

        // --- 2. Determine Priority Bonus ---
        let priorityBonus = 0;
        if (candidate.priority === 'high') priorityBonus = 10;
        else if (candidate.priority === 'medium') priorityBonus = 5;

        // --- 3. Apply Formula: Overall - (Fraud * 0.35) + PriorityBonus ---
        const fraudPenalty = Math.round(fraudScore * 0.35);
        let finalRankScore = overallScore - fraudPenalty + priorityBonus;

        // --- 4. Clamp result (0-100) ---
        finalRankScore = Math.round(Math.max(0, Math.min(100, finalRankScore)));

        console.log(`📊 Ranking for ${candidate.name}: ${overallScore} - (${fraudScore} * 0.35) + ${priorityBonus} = ${finalRankScore}`);

        // --- 5. Update Candidate Table ---
        // TARGETING: 'priority_score' as confirmed by your schema
        const { error: updateError } = await supabase
            .from('candidates')
            .update({
                priority_score: finalRankScore, // Main Dashboard Source
                status: 'PROCESSED',
                updated_at: new Date().toISOString()
            })
            .eq('id', candidateId);

        if (updateError) throw updateError;

        // --- 6. Detailed Breakdown for Report Page ---
        await supabase.from('candidate_scores').upsert([{
            candidate_id: candidateId,
            scores_json: {
                overallScore: overallScore, 
                fraudScore: fraudScore,
                fraudPenalty: fraudPenalty,
                priorityBonus: priorityBonus,
                finalRankScore: finalRankScore,
                calculatedAt: new Date().toISOString()
            }
        }], { onConflict: 'candidate_id' });

        return finalRankScore;

    } catch (error) {
        console.error("Critical Ranking Service Error:", error);
        return 0;
    }
};