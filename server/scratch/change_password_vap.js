const bcrypt = require('bcrypt');
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function changePassword() {
    try {
        await client.connect();
        const newPassword = 'VAP@WCE';
        const loginId = 'VAP@WCE';
        const hash = await bcrypt.hash(newPassword, 10);
        
        const res = await client.query('UPDATE users SET password = $1 WHERE login_id = $2', [hash, loginId]);
        
        if (res.rowCount > 0) {
            console.log(`Password for ${loginId} changed successfully to: ${newPassword}`);
        } else {
            console.log(`User ${loginId} not found.`);
        }
    } catch (err) {
        console.error('Error changing password:', err);
    } finally {
        await client.end();
    }
}

changePassword();
