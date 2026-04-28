const db = require('../db');
const bcrypt = require('bcrypt');

async function resetAdmin() {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash('password', salt);
        await db.query("UPDATE users SET password = $1 WHERE login_id = 'admin'", [hashed]);
        console.log('Admin password reset to: password');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

resetAdmin();
