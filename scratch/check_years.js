const db = require('../server/db');

async function check() {
    try {
        const res = await db.query('SELECT DISTINCT year FROM classes');
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

check();
