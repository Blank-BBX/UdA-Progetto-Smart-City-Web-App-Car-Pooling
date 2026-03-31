🚗 SmartCity Carpooling

Una piattaforma web per il carpooling urbano che consente agli utenti di condividere viaggi, ridurre i costi e migliorare la mobilità nelle smart city.

✨ Features
🔐 Autenticazione utenti (registrazione & login)
🚘 Pubblicazione viaggi (solo autisti)
🔍 Ricerca viaggi con filtri (città e data)
📅 Prenotazione viaggi
⭐ Sistema di feedback tra utenti
👤 Gestione stato utente lato frontend
⚡ API REST semplice e veloce
🛠️ Tech Stack

Frontend

React (Vite)
JavaScript (no framework CSS, inline styles)

Backend

Node.js
Express

Database

SQLite3
📦 Project Structure
smartcity-carpooling/
│
├── db/
│   ├── server.js        # API backend (Express)
│   └── database.db      # SQLite database
│
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── ConnectionCheck.jsx
│       │   └── Card.jsx
│       └── pages/
│           ├── Home.jsx
│           ├── Dashboard.jsx
│           ├── SearchTrip.jsx
│           ├── CreateTrip.jsx
│           ├── Login.jsx
│           ├── Register.jsx
│           └── Feedback.jsx
│
└── README.md
🚀 Getting Started
1️⃣ Clone del progetto
git clone https://github.com/tuo-username/smartcity-carpooling.git
cd smartcity-carpooling
2️⃣ Avvio Backend
cd db
npm install
node server.js

Server disponibile su:

http://localhost:3000
3️⃣ Avvio Frontend
cd frontend
npm install
npm run dev

App disponibile su:

http://localhost:5173
🔗 API Overview
Auth
POST /api/register → registrazione utente
POST /api/login → login
Trips
GET /api/trips → lista viaggi (con filtri)
POST /api/trips → crea viaggio
Bookings
POST /api/bookings → prenotazione
Feedback
POST /api/feedback → lascia recensione
