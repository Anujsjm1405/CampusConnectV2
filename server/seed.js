const db = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        console.log("Seeding database...");

        // Clear existing data
        await client.query('TRUNCATE TABLE timetable, classes, users RESTART IDENTITY CASCADE');

        const salt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash('admin123', salt);

        // 1. Create Admin User
        await client.query(`
            INSERT INTO users (name, login_id, password, role) 
            VALUES ('System Admin', 'admin', $1, 'ADMIN')
        `, [adminPassword]);

        // 2. Create Classes
        const years = ['SY', 'TY', 'B.Tech'];
        const divisions = ['A', 'B', 'No Div'];
        
        for (const year of years) {
            for (const div of divisions) {
                await client.query('INSERT INTO classes (year, division) VALUES ($1, $2)', [year, div]);
            }
        }
        
        // FY M.Tech - No Div only
        await client.query(`
            INSERT INTO classes (year, division) VALUES ('FY M.Tech', 'No Div')
        `);

        await client.query('COMMIT');
        console.log("Database initialized with Admin only.");
        process.exit(0);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error seeding database:", error);
        process.exit(1);
    } finally {
        client.release();
    }
}

seed();
