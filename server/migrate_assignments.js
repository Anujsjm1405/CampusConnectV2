const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'campus_connect',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
});

async function migrate() {
    try {
        console.log("Checking subject_assignments table...");
        await pool.query(`
            ALTER TABLE subject_assignments 
            ADD COLUMN IF NOT EXISTS session_type VARCHAR(20) DEFAULT 'BOTH';
        `);
        console.log("Migration successful: added session_type to subject_assignments");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}
migrate();
