const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.post('/login', async (req, res) => {
    try {
        const { login_id, password } = req.body;
        
        const userQuery = await db.query('SELECT * FROM users WHERE login_id = $1', [login_id]);
        if (userQuery.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        const user = userQuery.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        // Setup session
        req.session.user = {
            id: user.id,
            name: user.name,
            role: user.role
        };
        
        res.json({ message: "Login successful", user: req.session.user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: "Could not log out" });
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
    });
});

router.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.session.user });
});

module.exports = router;
