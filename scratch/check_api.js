async function checkTimetable() {
    try {
        // 1. Login as Anuj (Batch B1)
        const loginRes = await fetch('http://localhost:5000/api/auth/student-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prn: '246109044',
                name: 'Anuj Jundhare',
                year: 'SY',
                division: 'B',
                batch: 'B1'
            })
        });
        
        const loginData = await loginRes.json();
        const cookie = loginRes.headers.get('set-cookie');
        console.log('Login successful, batch:', loginData.user.batch);

        // 2. Fetch timetable
        const timeRes = await fetch('http://localhost:5000/api/students/timetable', {
            headers: { 'Cookie': cookie }
        });

        const timetable = await timeRes.json();
        console.log('Timetable items:', timetable.length);
        const labs = timetable.filter(t => t.session_type === 'LAB');
        console.log('Labs found for B1:');
        labs.forEach(l => {
            console.log(`- Day ${l.day_of_week}, Slot ${l.start_slot}: ${l.subject} (${l.batch})`);
        });

    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkTimetable();
