function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ error: "Unauthorized. Please log in." });
    }
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ error: "Forbidden. Admin access required." });
    }
}

function requireProfessor(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'PROFESSOR') {
        next();
    } else {
        res.status(403).json({ error: "Forbidden. Professor access required." });
    }
}

module.exports = { requireAuth, requireAdmin, requireProfessor };
