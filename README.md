<h1 align="center">🚗 SmartCity Carpooling</h1>

<p align="center">
  A simple full-stack carpooling platform for smart cities
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-Vite-blue?logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Express-green?logo=node.js" />
  <img src="https://img.shields.io/badge/Database-SQLite-lightgrey?logo=sqlite" />
</p>

---

## 🎬 Preview

![preview](./screenshots/app.png)

---

## ✨ Features

- 🔐 User authentication (login & register)
- 🚘 Create and publish trips
- 🔍 Search trips by city and date
- 📅 Booking system
- ⭐ Feedback and rating system
- 👤 Session-based user state

---

## 🛠️ Tech Stack

**Frontend**
- React (Vite)
- JavaScript (inline styles)

**Backend**
- Node.js
- Express

**Database**
- SQLite3

---

## 📁 Project Structure
smartcity-carpooling/
│
├── db/ # Backend (Express + SQLite)
│ ├── server.js
│ └── database.db
│
├── frontend/
│ └── src/
│ ├── App.jsx
│ ├── components/
│ └── pages/
│
└── README.md


---

## 🚀 Getting Started

### 1. Clone repository

```bash
git clone https://github.com/your-username/smartcity-carpooling.git
cd smartcity-carpooling
2. Start backend
cd db
npm install
node server.js

Backend running on:

http://localhost:3000
3. Start frontend
cd frontend
npm install
npm run dev

Frontend running on:

http://localhost:5173
🔗 API Overview
Auth
POST /api/register
POST /api/login
Trips
GET /api/trips
POST /api/trips
Bookings
POST /api/bookings
Feedback
POST /api/feedback
