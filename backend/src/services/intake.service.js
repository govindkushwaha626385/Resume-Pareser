import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../db/supabaseClient.js';

// Helper function to calculate initial priority score
const calculatePriorityScore = (priority, source) => {
    let score = 0;
    if (priority === 'high') score = 100;
    else if (priority === 'medium') score = 60;
    else score = 30;

    if (source === 'Referral') score += 20;
    if (source === 'ATS') score += 10;
    return score;
};

export const uploadResume = async (file, body) => {
    const { jobId, source, priority } = body;

    try {
        // 1. Generate Unique ID
        const uniqueSuffix = uuidv4().substring(0, 8);
        const candidateId = `CAND-${uniqueSuffix}`;
        const filePath = `${jobId}/${candidateId}_${file.originalname}`;

        // 2. Upload File to Storage
        const { error: storageError } = await supabase.storage
            .from('resumes')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
            });

        if (storageError) throw new Error(`Storage Upload Failed: ${storageError.message}`);

        const { data: urlData } = supabase.storage
            .from('resumes')
            .getPublicUrl(filePath);

        // 3. Calculate Initial Priority Score
        const priorityScore = calculatePriorityScore(priority, source);

        // 4. Save Candidate Metadata (CRITICAL: Await this fully)
        // We ensure the record exists in 'candidates' before the AI pipeline triggers
        const { data, error: dbError } = await supabase
            .from('candidates')
            .insert([{
                id: candidateId,
                job_id: jobId,
                source: source,
                priority: priority || 'low',
                priority_score: priorityScore,
                resume_file_path: filePath,
                status: 'UPLOADED'
            }])
            .select(); // This allows Supabase to return the created row

        if (dbError) {
            throw new Error(`Database Insert Failed: ${dbError.message}`);
        }

        // Now 'data' is defined and can be logged safely
        console.log("-----------------------------------------");
        console.log("💾 SUPABASE CONFIRMED SAVE:");
        console.log(data);
        console.log("-----------------------------------------");

        // 5. Create Audit Log
        // Using 'await' here ensures the audit trail is established
        await supabase.from('candidate_audit_logs').insert([{
            candidate_id: candidateId,
            step: 'UPLOAD',
            status: 'OK',
            details: {
                fileName: file.originalname,
                fileSize: file.size
            }
        }]);

        // 6. Return Success Response
        // Returning this allows the controller to safely start the AI Graph
        return {
            candidateId: candidateId,
            jobId: jobId,
            fileUrl: urlData.publicUrl,
            status: 'UPLOADED'
        };

    } catch (error) {
        console.error("Upload Service Error:", error);
        throw error;
    }
};