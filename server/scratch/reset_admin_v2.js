const bcrypt = require('bcrypt');
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function resetAdmin() {
    try {
        await client.connect();
        const hash = await bcrypt.hash('admin123', 10);
        await client.query('UPDATE users SET password = $1 WHERE login_id = $2', [hash, 'admin']);
        console.log('Admin password reset to admin123 successfully');
    } catch (err) {
        console.error('Error resetting admin password:', err);
    } finally {
        await client.end();
    }
}

resetAdmin();
