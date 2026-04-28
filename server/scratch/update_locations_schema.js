const db = require('../db');

async function updateSchema() {
    try {
        await db.query('ALTER TABLE locations ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES locations(id) ON DELETE CASCADE;');
        console.log('Successfully added parent_id to locations table');
    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        process.exit();
    }
}

updateSchema();
