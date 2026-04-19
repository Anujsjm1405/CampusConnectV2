const express = require('express');
const session = require('express-session');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'timetable_secret_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production if using HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/professors', require('./routes/professors'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
