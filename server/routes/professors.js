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

// Get status overrides for a professor (defaults to current date)
router.get('/status/:id', requireProfessor, async (req, res) => {
    try {
        const professor_id = req.params.id;
        const { date } = req.query;
        
        if (req.session.user.id !== parseInt(professor_id)) {
            return res.status(403).json({ error: "Access denied." });
        }

        const query = date 
            ? 'SELECT * FROM professor_status WHERE professor_id = $1 AND status_date = $2'
            : 'SELECT * FROM professor_status WHERE professor_id = $1 AND status_date = CURRENT_DATE';
        
        const params = date ? [professor_id, date] : [professor_id];
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Update, create or clear a status override
router.post('/status', requireProfessor, async (req, res) => {
    try {
        const { professor_id, day_of_week, slot_id, status, date } = req.body;
        const targetDate = date || 'CURRENT_DATE';
        
        if (req.session.user.id !== parseInt(professor_id)) {
            return res.status(403).json({ error: "Access denied." });
        }

        if (!status || status === 'DEFAULT') {
            const delQuery = targetDate === 'CURRENT_DATE'
                ? 'DELETE FROM professor_status WHERE professor_id = $1 AND status_date = CURRENT_DATE AND slot_id = $2'
                : 'DELETE FROM professor_status WHERE professor_id = $1 AND status_date = $2 AND slot_id = $3';
            const delParams = targetDate === 'CURRENT_DATE' ? [professor_id, slot_id] : [professor_id, targetDate, slot_id];
            await db.query(delQuery, delParams);
        } else {
            const query = `
                INSERT INTO professor_status (professor_id, status_date, day_of_week, slot_id, status)
                VALUES ($1, ${targetDate === 'CURRENT_DATE' ? 'CURRENT_DATE' : '$5'}, $2, $3, $4)
                ON CONFLICT (professor_id, status_date, slot_id)
                DO UPDATE SET status = EXCLUDED.status
                RETURNING *
            `;
            const params = targetDate === 'CURRENT_DATE' 
                ? [professor_id, day_of_week, slot_id, status]
                : [professor_id, day_of_week, slot_id, status, targetDate];
            await db.query(query, params);
        }
        
        const io = req.app.get('io');
        io.emit('status-update', { 
            professor_id, 
            day_of_week, 
            slot_id, 
            status: status || 'AVAILABLE',
            professor_name: req.session.user.name 
        });

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Bulk update status to 'LEAVE' for date ranges and slots
router.post('/leave', requireProfessor, async (req, res) => {
    try {
        const { professor_id, startDate, endDate, slotIds } = req.body;
        
        if (req.session.user.id !== parseInt(professor_id)) {
            return res.status(403).json({ error: "Access denied." });
        }

        const dates = [];
        let curr = new Date(startDate);
        const last = new Date(endDate);
        while (curr <= last) {
            dates.push(new Date(curr).toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }

        const targetSlots = (slotIds && slotIds.length > 0) ? slotIds : [0, 1, 2, 3, 4, 5, 6];

        for (const dateStr of dates) {
            const dateObj = new Date(dateStr);
            const dayOfWeek = dateObj.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;

            for (const slotId of targetSlots) {
                await db.query(`
                    INSERT INTO professor_status (professor_id, status_date, day_of_week, slot_id, status)
                    VALUES ($1, $2, $3, $4, 'LEAVE')
                    ON CONFLICT (professor_id, status_date, slot_id)
                    DO UPDATE SET status = 'LEAVE'
                `, [professor_id, dateStr, dayOfWeek, slotId]);
            }
        }
        
        const io = req.app.get('io');
        io.emit('bulk-status-update', { 
            professor_id, 
            startDate,
            endDate,
            status: 'LEAVE',
            professor_name: req.session.user.name 
        });
        
        res.json({ message: "Leave applied successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
