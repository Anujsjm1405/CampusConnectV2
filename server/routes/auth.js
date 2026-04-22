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

router.post('/student-login', async (req, res) => {
    try {
        const { prn, name, year, division, batch } = req.body;
        
        const classResult = await db.query('SELECT id FROM classes WHERE year = $1 AND division = $2', [year, division]);
        if (classResult.rows.length === 0) {
            return res.status(400).json({ error: "Selected class does not exist." });
        }
        const class_id = classResult.rows[0].id;

        const upsertQuery = `
            INSERT INTO students (prn, name, class_id, batch, status)
            VALUES ($1, $2, $3, $4, 'ACTIVE')
            ON CONFLICT (prn) DO UPDATE 
            SET name = $2, class_id = $3, batch = $4
            RETURNING *
        `;
        const result = await db.query(upsertQuery, [prn, name, class_id, batch]);
        const student = result.rows[0];
        
        req.session.user = {
            id: student.id,
            name: student.name,
            prn: student.prn,
            class_id: student.class_id,
            batch: student.batch,
            year: year,
            division: division,
            role: 'STUDENT'
        };
        
        res.json({ message: "Student access granted", user: req.session.user });
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

router.get('/classes', async (req, res) => {
    try {
        const result = await db.query("SELECT id, year, division FROM classes ORDER BY year ASC, division ASC");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
