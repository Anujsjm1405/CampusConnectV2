const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// Professor Management
router.post('/professors', requireAdmin, async (req, res) => {
    try {
        const { name, login_id, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const insertQuery = `
            INSERT INTO users (name, login_id, password, role)
            VALUES ($1, $2, $3, 'PROFESSOR') RETURNING id, name, login_id, role
        `;
        const newProf = await db.query(insertQuery, [name, login_id, hashedPassword]);
        res.status(201).json(newProf.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
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

router.delete('/professors/:id', requireAdmin, async (req, res) => {
    try {
        await db.query("DELETE FROM users WHERE id = $1 AND role = 'PROFESSOR'", [req.params.id]);
        res.json({ message: "Professor deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Class Management
router.get('/classes', requireAdmin, async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM classes ORDER BY year ASC, division ASC");
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Subject Assignments (Mappings)
router.get('/assignments', requireAdmin, async (req, res) => {
    try {
        const query = `
            SELECT sa.*, u.name as professor_name, c.year, c.division
            FROM subject_assignments sa
            JOIN users u ON sa.professor_id = u.id
            JOIN classes c ON sa.class_id = c.id
            ORDER BY c.year ASC, c.division ASC, sa.subject_name ASC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/assignments/:class_id', requireAdmin, async (req, res) => {
    try {
        const query = `
            SELECT sa.*, u.name as professor_name
            FROM subject_assignments sa
            JOIN users u ON sa.professor_id = u.id
            WHERE sa.class_id = $1
            ORDER BY sa.subject_name ASC
        `;
        const result = await db.query(query, [req.params.class_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

router.post('/assignments', requireAdmin, async (req, res) => {
    try {
        const { class_id, professor_id, subject_name } = req.body;
        const query = `
            INSERT INTO subject_assignments (class_id, professor_id, subject_name)
            VALUES ($1, $2, $3) RETURNING *
        `;
        const result = await db.query(query, [class_id, professor_id, subject_name]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: "Assignment already exists." });
        }
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.delete('/assignments/:id', requireAdmin, async (req, res) => {
    try {
        await db.query("DELETE FROM subject_assignments WHERE id = $1", [req.params.id]);
        res.json({ message: "Assignment deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

router.delete('/assignments/reset/:class_id', requireAdmin, async (req, res) => {
    try {
        await db.query("DELETE FROM subject_assignments WHERE class_id = $1", [req.params.class_id]);
        res.json({ message: "All assignments for this class cleared successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
