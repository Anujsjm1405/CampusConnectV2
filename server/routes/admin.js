const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// Professor Management
router.post('/professors', requireAdmin, async (req, res) => {
    try {
        const { name, login_id, password, designation } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const insertQuery = `
            INSERT INTO users (name, login_id, password, role, designation)
            VALUES ($1, $2, $3, 'PROFESSOR', $4) RETURNING id, name, login_id, role, designation
        `;
        const newProf = await db.query(insertQuery, [name, login_id, hashedPassword, designation || 'Assistant Professor']);
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
        const result = await db.query("SELECT id, name, login_id, role, designation FROM users WHERE role = 'PROFESSOR' ORDER BY name ASC");
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

router.put('/professors/:id', requireAdmin, async (req, res) => {
    try {
        const { designation } = req.body;
        await db.query("UPDATE users SET designation = $1 WHERE id = $2 AND role = 'PROFESSOR'", [designation, req.params.id]);
        res.json({ message: "Designation updated successfully" });
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
        const { class_id, professor_id, subject_name, session_type } = req.body;
        
        const query = `
            INSERT INTO subject_assignments (class_id, professor_id, subject_name, session_type)
            VALUES ($1, $2, $3, $4) RETURNING *
        `;
        const result = await db.query(query, [class_id, professor_id, subject_name, session_type]);
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

// Student Management & Promotion
router.get('/students', requireAdmin, async (req, res) => {
    try {
        const query = `
            SELECT s.*, c.year, c.division 
            FROM students s 
            JOIN classes c ON s.class_id = c.id 
            ORDER BY c.year ASC, c.division ASC, s.name ASC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

router.post('/promote-class', requireAdmin, async (req, res) => {
    try {
        const { source_class_id, target_class_id } = req.body;
        
        // If target_class_id is 'GRADUATED', mark them as such
        if (target_class_id === 'GRADUATED') {
            await db.query('UPDATE students SET status = \'GRADUATED\' WHERE class_id = $1', [source_class_id]);
            return res.json({ message: "Class marked as graduated successfully" });
        }

        const updateQuery = 'UPDATE students SET class_id = $1 WHERE class_id = $2 AND status = \'ACTIVE\'';
        const result = await db.query(updateQuery, [target_class_id, source_class_id]);
        
        res.json({ message: `${result.rowCount} students promoted successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error during class promotion" });
    }
});

// Batch Promotion Logic (Global)
router.post('/promote-students', requireAdmin, async (req, res) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const promotionMap = {
            'SY': 'TY',
            'TY': 'B.Tech'
        };
        const graduateYears = ['B.Tech', 'FY M.Tech'];

        // 1. Get all active students with their current class info
        const studentsResult = await client.query(`
            SELECT s.id, s.name, c.year, c.division 
            FROM students s 
            JOIN classes c ON s.class_id = c.id 
            WHERE s.status = 'ACTIVE'
        `);
        
        let promotedCount = 0;
        let graduatedCount = 0;

        for (const student of studentsResult.rows) {
            if (graduateYears.includes(student.year)) {
                // Delete graduated students as per requirement
                await client.query('DELETE FROM students WHERE id = $1', [student.id]);
                graduatedCount++;
            } else {
                const nextYear = promotionMap[student.year];
                if (nextYear) {
                    // Find the class for the next year with the same division
                    const classQuery = await client.query(
                        'SELECT id FROM classes WHERE year = $1 AND division = $2', 
                        [nextYear, student.division]
                    );
                    
                    if (classQuery.rows.length > 0) {
                        await client.query(
                            'UPDATE students SET class_id = $1 WHERE id = $2', 
                            [classQuery.rows[0].id, student.id]
                        );
                        promotedCount++;
                    }
                }
            }
        }
        
        await client.query('COMMIT');
        res.json({ 
            message: "Students promoted successfully", 
            details: { promoted: promotedCount, graduated: graduatedCount } 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: "Server error during promotion" });
    } finally {
        client.release();
    }
});

// New Semester Reset
router.post('/new-semester', requireAdmin, async (req, res) => {
    try {
        await db.query('TRUNCATE TABLE timetable, subject_assignments RESTART IDENTITY CASCADE');
        await db.query('DELETE FROM professor_status');
        res.json({ message: "System reset for new semester successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error during reset" });
    }
});

module.exports = router;
