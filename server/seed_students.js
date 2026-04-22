const db = require('./db');
const bcrypt = require('bcrypt');

async function seedStudents() {
    try {
        console.log("Seeding students...");
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash('student123', salt);

        // Get some class IDs
        const classResult = await db.query('SELECT id, year, division FROM classes LIMIT 3');
        const classes = classResult.rows;

        if (classes.length === 0) {
            console.log("No classes found. Please run seed.js first.");
            process.exit(1);
        }

        const students = [
            { name: 'Anuj Jundhare', prn: 'PRN001', class_id: classes[0].id },
            { name: 'Rahul Patil', prn: 'PRN002', class_id: classes[1].id },
            { name: 'Snehal Deshmukh', prn: 'PRN003', class_id: classes[2].id }
        ];

        for (const s of students) {
            await db.query(`
                INSERT INTO students (name, prn, class_id, password)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (prn) DO NOTHING
            `, [s.name, s.prn, s.class_id, defaultPassword]);
            console.log(`Seeded student: ${s.name} (${s.prn}) in ${classes.find(c => c.id === s.class_id).year} ${classes.find(c => c.id === s.class_id).division}`);
        }

        console.log("Student seeding complete.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding students:", error);
        process.exit(1);
    }
}

seedStudents();
