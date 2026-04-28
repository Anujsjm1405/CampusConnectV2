const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

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

module.exports = router;
