import * as chatService from '../services/chat.service.js';

export const chatWithResumeController = async (req, res) => {
    try {
        const { candidateId, question } = req.body;

        // Validation
        if (!candidateId || !question) {
            return res.status(400).json({ 
                error: "Missing required fields: candidateId or question." 
            });
        }

        // Call Service
        const answer = await chatService.askResumeQuestion(candidateId, question);
        
        // Success Response
        res.status(200).json({ answer });

    } catch (error) {
        console.error("Chat Controller Error:", error);
        res.status(500).json({ error: error.message });
    }
};