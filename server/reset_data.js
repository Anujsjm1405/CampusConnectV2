const db = require('./db');
const bcrypt = require('bcrypt');

async function resetData() {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        console.log("Cleaning database data...");

        // Truncate tables but keep classes (structural)
        // We also want to keep the Admin user or re-create it
        await client.query('TRUNCATE TABLE timetable, subject_assignments, professor_status, students, users RESTART IDENTITY CASCADE');
        
        console.log("Database cleared.");

        // Re-seed the default Admin
        const salt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash('admin123', salt);

        await client.query(`
            INSERT INTO users (name, login_id, password, role) 
            VALUES ('System Admin', 'admin', $1, 'ADMIN')
        `, [adminPassword]);

        console.log("Default Admin (admin/admin123) restored.");

        await client.query('COMMIT');
        console.log("Reset successful.");
        process.exit(0);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error resetting data:", error);
        process.exit(1);
    } finally {
        client.release();
    }
}

resetData();
