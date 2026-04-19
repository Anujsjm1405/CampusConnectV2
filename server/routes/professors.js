const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireProfessor } = require('../middleware/auth');

// Get professor's weekly timetable
router.get('/timetable/:id', requireProfessor, async (req, res) => {
    try {
        const professor_id = req.params.id;
        
        if (req.session.user.id !== parseInt(professor_id)) {
            return res.status(403).json({ error: "Access denied." });
        }
        
        const query = `
            SELECT t.*, c.year, c.division 
            FROM timetable t
            JOIN classes c ON t.class_id = c.id
            WHERE t.professor_id = $1
            ORDER BY t.day_of_week ASC, t.start_slot ASC
        `;
        const result = await db.query(query, [professor_id]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Get all status overrides for a professor
router.get('/status/:id', requireProfessor, async (req, res) => {
    try {
        const professor_id = req.params.id;
        if (req.session.user.id !== parseInt(professor_id)) {
            return res.status(403).json({ error: "Access denied." });
        }

        const result = await db.query(
            'SELECT * FROM professor_status WHERE professor_id = $1',
            [professor_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Update or create a status override
router.post('/status', requireProfessor, async (req, res) => {
    try {
        const { professor_id, day_of_week, slot_id, status } = req.body;
        
        if (req.session.user.id !== parseInt(professor_id)) {
            return res.status(403).json({ error: "Access denied." });
        }

        const query = `
            INSERT INTO professor_status (professor_id, day_of_week, slot_id, status)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (professor_id, day_of_week, slot_id)
            DO UPDATE SET status = EXCLUDED.status
            RETURNING *
        `;
        const result = await db.query(query, [professor_id, day_of_week, slot_id, status]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Bulk update status to 'LEAVE' for specific days
router.post('/leave', requireProfessor, async (req, res) => {
    try {
        const { professor_id, days } = req.body; // days is an array of day_of_week (1-5)
        
        if (req.session.user.id !== parseInt(professor_id)) {
            return res.status(403).json({ error: "Access denied." });
        }

        // For each day and each slot (0-6), set status to LEAVE
        for (const day of days) {
            for (let slot = 0; slot <= 6; slot++) {
                await db.query(`
                    INSERT INTO professor_status (professor_id, day_of_week, slot_id, status)
                    VALUES ($1, $2, $3, 'LEAVE')
                    ON CONFLICT (professor_id, day_of_week, slot_id)
                    DO UPDATE SET status = 'LEAVE'
                `, [professor_id, day, slot]);
            }
        }
        
        res.json({ message: "Leave applied successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
