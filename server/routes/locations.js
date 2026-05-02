const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin, requireAuth } = require('../middleware/auth');

// Get live status of all locations
router.get('/live-status', requireAuth, async (req, res) => {
    try {
        const { day_of_week, slot_id } = req.query;
        
        if (!day_of_week || slot_id === undefined || slot_id === '-1') {
            const result = await db.query('SELECT l.*, p.name as parent_name FROM locations l LEFT JOIN locations p ON l.parent_id = p.id ORDER BY l.name ASC');
            const locations = result.rows.map(loc => ({ ...loc, live_status: 'AVAILABLE' }));
            return res.json(locations);
        }

        const locationsRes = await db.query(`
            SELECT l.*, p.name as parent_name 
            FROM locations l 
            LEFT JOIN locations p ON l.parent_id = p.id 
            ORDER BY l.name ASC
        `);
        const locations = locationsRes.rows;

        // Fetch timetable entries for the given day and slot
        const timetableRes = await db.query(`
            SELECT t.location_id, t.session_type, t.subject, u.name as professor_name, c.year, c.division, t.batch
            FROM timetable t
            JOIN users u ON t.professor_id = u.id
            JOIN classes c ON t.class_id = c.id
            WHERE t.day_of_week = $1 
              AND (t.start_slot = $2 OR (t.start_slot = $3 AND t.duration_slots = 2))
        `, [day_of_week, slot_id, parseInt(slot_id) - 1]);
        
        const occupiedMap = {};
        timetableRes.rows.forEach(row => {
            occupiedMap[row.location_id] = row;
        });

        const statusList = locations.map(loc => {
            let occupation = occupiedMap[loc.id];
            
            if (!occupation && loc.parent_id && occupiedMap[loc.parent_id]) {
                occupation = occupiedMap[loc.parent_id];
            }
            
            if (!occupation) {
                const childOccupationId = Object.keys(occupiedMap).find(occId => {
                    const occLoc = locations.find(l => l.id == occId);
                    return occLoc && occLoc.parent_id === loc.id;
                });
                if (childOccupationId) {
                    occupation = occupiedMap[childOccupationId];
                }
            }

            return {
                ...loc,
                live_status: occupation ? (occupation.session_type === 'LAB' ? 'IN LAB' : 'IN LECTURE') : 'AVAILABLE',
                details: occupation || null
            };
        });

        res.json(statusList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Get all locations
router.get('/', requireAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT l.*, p.name as parent_name 
            FROM locations l 
            LEFT JOIN locations p ON l.parent_id = p.id 
            ORDER BY l.name ASC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Add a new location
router.post('/', requireAdmin, async (req, res) => {
    try {
        let { name, type, capacity, parent_id, parent_name } = req.body;
        
        // If parent_name is provided, resolve it to a parent_id
        if (parent_name) {
            // Check if we are registering the parent itself
            if (name !== parent_name) {
                // Find existing parent (Main Lab)
                let parentResult = await db.query('SELECT id FROM locations WHERE name = $1 AND parent_id IS NULL', [parent_name]);
                
                if (parentResult.rows.length > 0) {
                    parent_id = parentResult.rows[0].id;
                } else {
                    // Create new parent (Main Lab)
                    const newParent = await db.query(
                        'INSERT INTO locations (name, type, capacity, parent_id) VALUES ($1, $2, $3, $4) RETURNING id',
                        [parent_name, 'LAB', null, null]
                    );
                    parent_id = newParent.rows[0].id;
                }
            } else {
                // Registering a top-level lab
                parent_id = null;
            }
        }

        const result = await db.query(
            'INSERT INTO locations (name, type, capacity, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, type, capacity || null, parent_id || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: "Location name already exists." });
        }
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete a location
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM locations WHERE id = $1', [req.params.id]);
        res.json({ message: "Location deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Edit a location
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        let { name, type, capacity, parent_name } = req.body;
        let parent_id = null;
        
        if (type === 'LAB' && parent_name && name !== parent_name) {
            let parentResult = await db.query('SELECT id FROM locations WHERE name = $1 AND parent_id IS NULL', [parent_name]);
            if (parentResult.rows.length > 0) {
                parent_id = parentResult.rows[0].id;
            } else {
                const newParent = await db.query(
                    'INSERT INTO locations (name, type, capacity, parent_id) VALUES ($1, $2, $3, $4) RETURNING id',
                    [parent_name, 'LAB', null, null]
                );
                parent_id = newParent.rows[0].id;
            }
        }

        const result = await db.query(
            'UPDATE locations SET name = $1, type = $2, capacity = $3, parent_id = $4 WHERE id = $5 RETURNING *',
            [name, type, capacity || null, parent_id || null, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: "Location name already exists." });
        }
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
