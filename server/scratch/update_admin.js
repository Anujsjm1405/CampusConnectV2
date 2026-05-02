const db = require('../db');
const bcrypt = require('bcrypt');

async function updateAdminPassword() {
    try {
        const salt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash('admin123', salt);

        await db.query(`
            UPDATE users SET password = $1 WHERE login_id = 'admin'
        `, [adminPassword]);

        console.log("Admin password successfully updated to 'admin123'.");
        process.exit(0);
    } catch (error) {
        console.error("Error updating admin password:", error);
        process.exit(1);
    }
}

updateAdminPassword();
