import { supabase } from '../db/supabaseClient.js';
import * as intakeService from '../services/intake.service.js';
import * as reportingService from '../services/reporting.service.js';
import { sendCandidateEmail } from '../services/email.service.js';
import { resumeGraph } from '../agents/resumePipeline.graph.js';

// --- 1. Upload Resume ---
export const uploadResumeController = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        if (!req.body.jobId) return res.status(400).json({ error: 'Job ID is required' });

        const result = await intakeService.uploadResume(req.file, req.body);
        res.status(200).json(result);
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// --- 2. AI Processing Pipeline ---
export const processCandidateController = async (req, res) => {
    try {
        const { candidateId, jobId, verificationEnabled } = req.body;

        console.log("-----------------------------------------");
        console.log(`📡 INCOMING REQUEST: Pipeline trigger received.`);
        console.log(`🆔 CANDIDATE ID: ${candidateId}`);
        console.log(`📂 JOB ID: ${jobId}`);
        console.log("-----------------------------------------");

        if (!candidateId || !jobId) {
            return res.status(400).json({ error: "Missing candidateId or jobId" });
        }

        const inputs = {
            candidateId,
            jobId,
            status: "START",
            errors: [],
            verificationEnabled: verificationEnabled || false
        };

        console.log(`🚀 Starting AI Pipeline for: ${candidateId}`);

        // Triggers the LangGraph pipeline
        const state = await resumeGraph.invoke(inputs);

        if (state.status === "FAILED" || state.errors.length > 0) {
            return res.status(500).json({ error: "AI Pipeline Failed", details: state.errors });
        }

        // --- Logic for Auto-Emails ---
        let emailActionTaken = false;
        try {
            const score = state.finalRank || 0;
            if (score >= 75) {
                await sendCandidateEmail(candidateId, 'shortlist');
                emailActionTaken = true;
            } else if (score < 60) {
                await sendCandidateEmail(candidateId, 'reject');
                emailActionTaken = true;
            }
        } catch (emailError) {
            console.warn("⚠️ Auto-Email Failed:", emailError.message);
        }

        // --- BUILD THE RICH JSON OUTPUT ---
        const finalResult = {
            candidateId: state.candidateId,
            jobId: state.jobId,
            parsing: {
                parsed: !!state.rawText,
                fieldsExtracted: Object.keys(state.structuredProfile || {})
            },
            verification: {
                enabled: state.verificationEnabled || false,
                checksAttempted: state.verificationResult?.checks || [],
                trustSignals: state.verificationResult?.signals || []
            },
            fraud: {
                fraudScore: Math.round(state.fraudResult?.fraudScore || 0),
                flags: state.fraudResult?.flags || ["NONE"],
                timelineIssues: state.fraudResult?.details?.aiAnalysis || []
            },
            evaluation: {
                // Maps to skillMatchScore (50% weight)
                skillMatchScore: state.evaluation?.skillMatchScore || 0,

                // Maps to experienceRelevanceScore (35% weight)
                experienceRelevanceScore: state.evaluation?.experienceRelevanceScore || 0,

                // Maps to educationFitScore (15% weight)
                educationFitScore: state.evaluation?.educationFitScore || 0,

                // The final score after fraud penalties and priority bonuses
                overallScore: state.finalRank,

                // Mandatory 3-6 bullet justifications
                explainability: state.evaluation?.explainability || [],

                // Optional: Pass through the raw evaluation breakdown for the frontend
                fullBreakdown: state.evaluation || {}
            },
            rank: state.finalRank,
            status: "PROCESSED",
            autoEmailSent: emailActionTaken,
            processedAt: new Date().toISOString()
        };

        // Send the complete intelligence object back to the client
        res.status(200).json(finalResult);

    } catch (error) {
        console.error("Processing Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// --- 3. Get Candidate Report ---
export const getReportController = async (req, res) => {
    try {
        const { candidateId } = req.params;
        const report = await reportingService.getCandidateReport(candidateId);
        res.status(200).json(report);
    } catch (error) {
        const statusCode = error.message === "Candidate not found" ? 404 : 500;
        res.status(statusCode).json({ error: error.message });
    }
};

// --- 4. Get Leaderboard ---
export const getLeaderboardController = async (req, res) => {
    try {
        const { jobId } = req.params;
        const result = await reportingService.getJobLeaderboard(jobId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- 5. Manual Email Trigger (Fixes 404) ---
export const sendEmailController = async (req, res) => {
    // Frontend sends 'type' (shortlist/reject) for this specific button
    const { candidateId, type } = req.body;

    try {
        if (!candidateId || !type) {
            return res.status(400).json({ error: "Missing candidateId or email type" });
        }

        await sendCandidateEmail(candidateId, type);
        res.status(200).json({ message: `Email (${type}) sent successfully.` });
    } catch (error) {
        console.error("Manual Email Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// --- 6. Handle Decision (Logistics & Status Update) ---
export const handleDecisionController = async (req, res) => {
    const { candidateId, decision } = req.body;

    try {
        if (!candidateId || !decision) {
            return res.status(400).json({ error: "Missing candidateId or decision" });
        }

        // 1. Update Database Status
        // This marks the candidate as 'SHORTLISTED' or 'REJECTED' in Supabase
        const { error: updateError } = await supabase
            .from('candidates')
            .update({ status: decision })
            .eq('id', candidateId);

        if (updateError) throw updateError;

        // 2. Automated Logistics Dispatch
        // We trigger the email agent based on the recruiter's decision
        let emailSent = false;
        try {
            const emailType = decision === 'SHORTLISTED' ? 'shortlist' : 'reject';
            await sendCandidateEmail(candidateId, emailType);
            emailSent = true;
            console.log(`📧 Logistics: ${emailType} email sent for ${candidateId}`);
        } catch (emailError) {
            // We catch email errors separately so the DB update still counts
            console.warn(`⚠️ Logistics Warning: Status saved but email failed: ${emailError.message}`);
        }

        // 3. Detailed Response
        res.status(200).json({
            success: true,
            message: `Status updated to ${decision}`,
            logistics: {
                emailStatus: emailSent ? "SENT" : "FAILED",
                action: decision === 'SHORTLISTED' ? "WELCOME_DISPATCHED" : "REJECTION_DISPATCHED"
            }
        });

    } catch (error) {
        console.error("Decision Controller Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// --- 7. Jobs Management ---
export const getJobsList = async (req, res) => {
    try {
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('id, title')
            .order('id', { ascending: true });

        if (error) throw error;
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createJobController = async (req, res) => {
    try {
        const { id, title, jd_text, must_have_skills, good_to_have_skills, min_exp_years, max_exp_years } = req.body;
        if (!id || !title || !jd_text) return res.status(400).json({ error: "Missing required fields" });

        const { data, error } = await supabase
            .from('jobs')
            .insert([{ id, title, jd_text, must_have_skills, good_to_have_skills, min_exp_years, max_exp_years }]);

        if (error) throw error;
        res.status(201).json({ message: "Job created successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

