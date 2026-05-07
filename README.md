# 🎓 CampusConnect: Next-Gen Academic Management System

**CampusConnect** is a premium, real-time academic coordination platform designed for modern educational institutions. It features a stunning glassmorphism UI and a robust client-server architecture to manage faculty availability, student schedules, and resource allocation with precision.

---

## ✨ Core Features

### 👨‍💼 Administrative Hub
- **Faculty Management**: Register professors with unique IDs, emails, and designations.
- **Student Directory**: Centralized admin-led student enrollment with PRN-based authentication.
- **Intelligent Mapping**: Map faculty to subjects and classes with support for Lectures, Labs, and Batch-specific sessions.
- **Resource Management**: Manage classrooms and labs with occupancy tracking.
- **Batch Promotion**: One-click global promotion of batches (SY → TY → B.Tech) with automatic graduation cleanup.

### 👩‍🎓 Student Experience
- **Real-Time Faculty Pulse**: Instant visibility into professor availability (Available, Busy, In Lecture, In Lab, On Leave).
- **Personalized Timetable**: View batch-specific schedules that filter out irrelevant lab sessions.
- **Live Campus Status**: See ongoing lectures and upcoming sessions in a high-fidelity dashboard.
- **Faculty Search**: Search for department faculty and view their current status and semester assignments.

### 👨‍🏫 Professor Dashboard
- **Instant Status Overrides**: Update availability with a single tap, broadcasted instantly to all students.
- **Live Location Occupancy**: See which classrooms and labs are currently free or occupied based on the master schedule.
- **Dynamic Scheduling**: View personal assignments and manage daily academic workflows.

---

## 🛠 Tech Stack

- **Frontend**: React.js with Vanilla CSS (Glassmorphism design system)
- **Backend**: Node.js & Express
- **Database**: PostgreSQL
- **Real-Time**: Socket.io for instant status broadcasting
- **Icons**: Lucide-react
- **Authentication**: JWT-based secure sessions

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL
- npm or yarn

### 1. Database Setup
1. Create a PostgreSQL database named `campus_connect`.
2. Run the schema provided in `server/db.sql` to set up tables:
   ```bash
   psql -d campus_connect -f server/db.sql
   ```

### 2. Environment Configuration
Create a `.env` file in the `server/` directory:
```env
DATABASE_URL=postgres://your_user:your_password@localhost:5432/campus_connect
JWT_SECRET=your_super_secret_key
PORT=5000
```

### 3. Installation
Install dependencies for both client and server:
```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 4. Running the Project
Open two terminals to run both services:

**Terminal 1: Backend Server**
```bash
cd server
npm start
```

**Terminal 2: Frontend Client**
```bash
cd client
npm run dev
```

---

## 📖 Usage Guide

### Default Admin Credentials
- **Role**: Admin
- **Username**: `admin`
- **Password**: `admin123`
*(Note: These are initial setup credentials, change them in the database for production)*

### Workflow
1. **Admin**: Log in and register **Professors** and **Locations**.
2. **Admin**: Use **Faculty Mapping** to assign professors to subjects for specific years/divisions.
3. **Admin**: Use **Class Timetable** to allot slots (Lecture/Lab) to specific assignments and rooms.
4. **Professor**: Log in to see your schedule and update your live status.
5. **Student**: Log in using the credentials provided by the admin to see your live schedule and faculty status.

---

## 🎨 Design Philosophy
CampusConnect utilizes a **Glassmorphism** aesthetic, emphasizing:
- **Translucency**: Frosted glass panels with backdrop blurs.
- **Vibrancy**: High-contrast accent colors (Indigo, Emerald, Rose) to denote status.
- **Responsiveness**: Fully optimized for both desktop management and mobile student/faculty use.
- **Motion**: Subtle micro-animations for a "living" system feel.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
