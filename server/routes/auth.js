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
        const { prn, password } = req.body;
        
        const studentQuery = await db.query(`
            SELECT s.*, c.year, c.division 
            FROM students s 
            JOIN classes c ON s.class_id = c.id 
            WHERE s.prn = $1
        `, [prn]);
        
        if (studentQuery.rows.length === 0) {
            return res.status(401).json({ error: "PRN not found. Please register first." });
        }
        
        const student = studentQuery.rows[0];
        
        if (!student.password) {
            return res.status(401).json({ error: "Password not set. Please contact admin." });
        }

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        req.session.user = {
            id: student.id,
            name: student.name,
            prn: student.prn,
            class_id: student.class_id,
            batch: student.batch,
            year: student.year,
            division: student.division,
            role: 'STUDENT'
        };
        
        res.json({ message: "Student login successful", user: req.session.user });
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
