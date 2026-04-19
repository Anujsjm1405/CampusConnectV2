const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

router.post('/professors', requireAdmin, async (req, res) => {
    try {
        const { name, login_id, password } = req.body;
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const insertQuery = `
            INSERT INTO users (name, login_id, password, role)
            VALUES ($1, $2, $3, 'PROFESSOR') RETURNING id, name, login_id, role
        `;
        const newProf = await db.query(insertQuery, [name, login_id, hashedPassword]);
        res.status(201).json(newProf.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // unique violation
             return res.status(409).json({ error: "Login ID already exists." });
        }
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/professors', requireAdmin, async (req, res) => {
    try {
        const result = await db.query("SELECT id, name, login_id, role FROM users WHERE role = 'PROFESSOR' ORDER BY name ASC");
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/classes', requireAdmin, async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM classes ORDER BY year ASC, division ASC");
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
