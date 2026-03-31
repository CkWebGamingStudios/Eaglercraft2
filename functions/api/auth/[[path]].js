// Session management with expiration checking
const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

let sessions = {};

function validateSession(sessionId) {
    const session = sessions[sessionId];
    if (session) {
        const now = Date.now();
        if (now - session.timestamp < SESSION_EXPIRY_MS) {
            return true; // session is valid
        } else {
            delete sessions[sessionId]; // clean up expired session
        }
    }
    return false; // session is invalid
}

function createSession(userId) {
    const sessionId = generateSessionId();
    sessions[sessionId] = {
        userId: userId,
        timestamp: Date.now()
    };
    return sessionId;
}

function cleanupExpiredSessions() {
    const now = Date.now();
    for (const sessionId in sessions) {
        if (now - sessions[sessionId].timestamp >= SESSION_EXPIRY_MS) {
            delete sessions[sessionId];
        }
    }
}

setInterval(cleanupExpiredSessions, 24 * 60 * 60 * 1000); // Run cleanup every day

// Add your other endpoint logic here for /users
