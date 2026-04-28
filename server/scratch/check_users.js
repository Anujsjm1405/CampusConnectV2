const db = require('../db');
const bcrypt = require('bcrypt');

async function checkUsers() {
    try {
        const res = await db.query('SELECT login_id, role FROM users');
        console.log('Current users:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkUsers();
