const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireStudent } = require('../middleware/auth');

// Get all professors and their live status for a specific day/slot
router.get('/professors-status', requireStudent, async (req, res) => {
    try {
        const { day, slot } = req.query;
        
        let query;
        let params = [];
        
        if (day && slot) {
            query = `
                SELECT u.id, u.name, u.designation,
                       COALESCE(ps.status, 'ACTIVE') as status
                FROM users u
                LEFT JOIN professor_status ps ON u.id = ps.professor_id 
                     AND ps.day_of_week = $1 AND ps.slot_id = $2
                WHERE u.role = 'PROFESSOR'
                ORDER BY u.name ASC
            `;
            params = [day, slot];
        } else {
            query = `
                SELECT id, name, designation, 'ACTIVE' as status
                FROM users 
                WHERE role = 'PROFESSOR'
                ORDER BY name ASC
            `;
        }
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Get student's class timetable (Filtered by Batch)
router.get('/timetable', requireStudent, async (req, res) => {
    try {
        const { class_id, batch } = req.session.user;
        const query = `
            SELECT t.*, u.name as professor_name
            FROM timetable t
            JOIN users u ON t.professor_id = u.id
            WHERE t.class_id = $1 
            AND (t.session_type != 'LAB' OR t.batch = $2)
            ORDER BY t.day_of_week ASC, t.start_slot ASC
        `;
        const result = await db.query(query, [class_id, batch]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
