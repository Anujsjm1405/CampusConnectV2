const cron = require('node-cron');
const db = require('./db');

// Initialize cron jobs
const initCronJobs = () => {
    // Task: Reset all professor statuses every Sunday at midnight (00:00)
    // Schedule: 0 0 * * 0 (Minute Hour DayOfMonth Month DayOfWeek)
    cron.schedule('0 0 * * 0', async () => {
        console.log('Running weekly status reset (Sunday Midnight)...');
        try {
            // Option 1: Delete all overrides
            await db.query('DELETE FROM professor_status');
            
            // Option 2: If we wanted to keep future leaves but reset past/current:
            // await db.query('DELETE FROM professor_status WHERE status_date <= CURRENT_DATE');
            
            console.log('Successfully reset all professor statuses for the new week.');
        } catch (error) {
            console.error('Error during weekly status reset:', error);
        }
    });

    console.log('Cron jobs initialized: Weekly reset scheduled for Sunday 00:00.');
};

module.exports = { initCronJobs };
