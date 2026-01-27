// Helper: Updates value if new data is provided, otherwise keeps old data
const update = (current, next) => next ?? current;

// Define the State Channels for the AI Graph
export const AgentState = {
    candidateId: {
        value: null,
        reducer: update,
    },
    jobId: {
        value: null,
        reducer: update,
    },
    rawText: {
        value: null,
        reducer: update,
    },
    structuredProfile: {
        value: null,
        reducer: update,
    },
    verificationResult: {
        value: null,
        reducer: update,
    },
    fraudResult: {
        value: null,
        reducer: update,
    },
    scoringResult: {
        value: null,
        reducer: update,
    },
    finalRank: {
        value: 0,
        reducer: update,
    },
    status: {
        value: "START",
        reducer: update,
    },
    verificationEnabled: {
        value: false,
        reducer: update,
    },
    
    // Special Case: Errors should ACCUMULATE (append), not overwrite
    errors: {
        value: [],
        reducer: (current, newErrors) => current.concat(newErrors),
    },
};