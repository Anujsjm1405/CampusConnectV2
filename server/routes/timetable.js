const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

router.post('/', requireAdmin, async (req, res) => {
    try {
        const { class_id, professor_id, subject, location, day_of_week, start_slot, session_type, batch } = req.body;
        
        let duration_slots = session_type === 'LAB' ? 2 : 1;
        
        // LAB Constraint: Cannot start at slot 6
        if (session_type === 'LAB' && start_slot === 6) {
            return res.status(400).json({ error: "LAB cannot start at the last slot." });
        }
        
        // 1. Check same professor overlap (Professor can never be in two places at once)
        const profOverlapQuery = `
            SELECT * FROM timetable 
            WHERE professor_id = $1 AND day_of_week = $2
              AND (start_slot < $3::int + $4::int) AND ($3::int < start_slot + duration_slots)
        `;
        const profOverlap = await db.query(profOverlapQuery, [professor_id, day_of_week, start_slot, duration_slots]);
        if (profOverlap.rows.length > 0) {
            return res.status(409).json({ error: "Professor already has a session at this time." });
        }

        // 2. Check class overlap with batch logic
        const classOverlapQuery = `
            SELECT * FROM timetable 
            WHERE class_id = $1 AND day_of_week = $2
              AND (start_slot < $3::int + $4::int) AND ($3::int < start_slot + duration_slots)
        `;
        const classOverlap = await db.query(classOverlapQuery, [class_id, day_of_week, start_slot, duration_slots]);
        
        if (classOverlap.rows.length > 0) {
            // LECTURE is exclusive for the whole class
            if (session_type === 'LECTURE') {
                return res.status(409).json({ error: "Class already has a session at this time. Lectures require the whole class." });
            }
            
            // If any existing session is a LECTURE, no new session can be added
            if (classOverlap.rows.some(r => r.session_type === 'LECTURE')) {
                return res.status(409).json({ error: "Class has a lecture at this time. No other sessions can be scheduled." });
            }
            
            // If both are LABs, check batches
            if (session_type === 'LAB') {
                // If new lab has no batch, it's a full-class lab
                if (!batch) {
                    return res.status(409).json({ error: "Full-class lab session overlaps with existing sessions." });
                }
                // If any existing lab has no batch, it's a full-class lab
                if (classOverlap.rows.some(r => !r.batch)) {
                    return res.status(409).json({ error: "Parallel lab not possible: Class has a full-session lab scheduled." });
                }
                // Check if the exact same batch is already busy
                if (classOverlap.rows.some(r => r.batch === batch)) {
                    return res.status(409).json({ error: `Batch ${batch} already has a lab assigned at this time.` });
                }
            }
        }

        const insertQuery = `
            INSERT INTO timetable (class_id, professor_id, subject, location, day_of_week, start_slot, duration_slots, session_type, batch)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
        `;
        const newTimetable = await db.query(insertQuery, [class_id, professor_id, subject, location, day_of_week, start_slot, duration_slots, session_type, batch || null]);
        
        res.status(201).json(newTimetable.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/', requireAdmin, async (req, res) => {
    try {
        const { class_id } = req.query;
        if (!class_id) return res.status(400).json({ error: "class_id is required" });
        
        const query = `
            SELECT t.*, u.name as professor_name 
            FROM timetable t
            JOIN users u ON t.professor_id = u.id
            WHERE t.class_id = $1
            ORDER BY t.day_of_week ASC, t.start_slot ASC
        `;
        const result = await db.query(query, [class_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Reset entire timetable for a class - MUST BE ABOVE /:id
router.delete('/reset/:class_id', requireAdmin, async (req, res) => {
    try {
        const { class_id } = req.params;
        await db.query('DELETE FROM timetable WHERE class_id = $1', [class_id]);
        res.json({ message: "Timetable reset successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM timetable WHERE id = $1', [req.params.id]);
        res.json({ message: "Entry deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
