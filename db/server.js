// db/server.js — SmartCity Carpooling Backend v1.1
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const sqlite3 = require("sqlite3").verbose();
const crypto  = require("crypto");

const app  = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ── Helpers ───────────────────────────────────────────────────────────────────
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

// ── Database ──────────────────────────────────────────────────────────────────
const DB_PATH = path.join(__dirname, "database.db");
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) { console.error("❌ Errore apertura DB:", err.message); process.exit(1); }
  console.log("✅ Connesso al database SQLite");
});

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  db.run(`CREATE TABLE IF NOT EXISTS utenti (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    nome     TEXT NOT NULL,
    cognome  TEXT NOT NULL,
    email    TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    telefono TEXT,
    tipo     TEXT NOT NULL DEFAULT 'passeggero'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS veicoli (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    id_utente  INTEGER NOT NULL REFERENCES utenti(id),
    modello    TEXT NOT NULL,
    targa      TEXT NOT NULL UNIQUE,
    posti      INTEGER NOT NULL DEFAULT 4,
    carburante TEXT NOT NULL DEFAULT 'benzina',
    foto       TEXT
  )`);

  // Migrazione sicura: aggiunge colonna carburante se il DB era già esistente
  db.run("ALTER TABLE veicoli ADD COLUMN carburante TEXT NOT NULL DEFAULT 'benzina'", () => {});

  db.run(`CREATE TABLE IF NOT EXISTS viaggi (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    id_utente      INTEGER NOT NULL REFERENCES utenti(id),
    id_veicolo     INTEGER REFERENCES veicoli(id),
    citta_partenza TEXT NOT NULL,
    citta_arrivo   TEXT NOT NULL,
    data_viaggio   TEXT NOT NULL,
    ora_partenza   TEXT NOT NULL,
    ora_arrivo     TEXT NOT NULL,
    posti          INTEGER NOT NULL DEFAULT 3,
    descrizione    TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS prenotazioni (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    id_viaggio    INTEGER NOT NULL REFERENCES viaggi(id),
    id_passeggero INTEGER NOT NULL REFERENCES utenti(id),
    stato         TEXT NOT NULL DEFAULT 'in_attesa'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS feedback (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    id_autore       INTEGER NOT NULL REFERENCES utenti(id),
    id_destinatario INTEGER NOT NULL REFERENCES utenti(id),
    id_viaggio      INTEGER REFERENCES viaggi(id),
    voto            INTEGER NOT NULL,
    commento        TEXT
  )`);

  seedTestData();
});

// ── Seed dati di test ─────────────────────────────────────────────────────────
function seedTestData() {
  const pw = sha256("password123");

  const users = [
    [1, "Marco",    "Bianchi",  "marco@test.it",    pw, "3331234567", "autista"],
    [2, "Laura",    "Rossi",    "laura@test.it",    pw, "3337654321", "autista"],
    [3, "Giovanni", "Ferrari",  "giovanni@test.it", pw, "3339876543", "autista"],
    [4, "Sofia",    "Conti",    "sofia@test.it",    pw, "3334567890", "passeggero"],
    [5, "Luca",     "Esposito", "luca@test.it",     pw, "3336789012", "passeggero"],
    [6, "Chiara",   "Martini",  "chiara@test.it",   pw, null,         "passeggero"],
  ];
  users.forEach(u =>
    db.run("INSERT OR IGNORE INTO utenti (id,nome,cognome,email,password,telefono,tipo) VALUES (?,?,?,?,?,?,?)", u)
  );

  const vehicles = [
    [1, 1, "Fiat Panda",          "AB123CD", 5, "benzina"],
    [2, 2, "Toyota Yaris Hybrid", "EF456GH", 5, "ibrido"],
    [3, 3, "Tesla Model 3",       "IJ789KL", 5, "elettrico"],
    [4, 1, "Volkswagen Golf",     "MN012OP", 5, "diesel"],
  ];
  vehicles.forEach(v =>
    db.run("INSERT OR IGNORE INTO veicoli (id,id_utente,modello,targa,posti,carburante) VALUES (?,?,?,?,?,?)", v)
  );

  const pastTrips = [
    [1, 1, 1, "Milano",  "Roma",    "2025-01-10", "08:00", "14:00", 3, "Viaggio diretto, soste autogrill"],
    [2, 2, 2, "Torino",  "Bologna", "2025-01-15", "09:00", "13:30", 4, "Auto ibrida, consumi ridotti"],
    [3, 3, 3, "Roma",    "Napoli",  "2025-02-20", "10:00", "12:30", 4, "Tesla silenziosa e comoda"],
    [4, 1, 4, "Milano",  "Firenze", "2025-03-05", "07:30", "11:00", 2, "Partenza puntuale"],
    [5, 2, 2, "Venezia", "Milano",  "2025-03-12", "15:00", "17:30", 3, null],
    [6, 3, 3, "Napoli",  "Bari",    "2025-03-20", "11:00", "14:00", 3, "Zero emissioni!"],
  ];
  pastTrips.forEach(t =>
    db.run("INSERT OR IGNORE INTO viaggi (id,id_utente,id_veicolo,citta_partenza,citta_arrivo,data_viaggio,ora_partenza,ora_arrivo,posti,descrizione) VALUES (?,?,?,?,?,?,?,?,?,?)", t)
  );

  const bookings = [
    [1, 1, 4, "accettata"], [2, 1, 5, "accettata"],
    [3, 2, 4, "accettata"], [4, 3, 5, "accettata"],
    [5, 4, 6, "accettata"], [6, 5, 6, "accettata"],
    [7, 2, 6, "accettata"], [8, 3, 6, "accettata"],
  ];
  bookings.forEach(b =>
    db.run("INSERT OR IGNORE INTO prenotazioni (id,id_viaggio,id_passeggero,stato) VALUES (?,?,?,?)", b)
  );

  const feedbacks = [
    [1, 4, 1, 1, 5, "Autista puntuale e gentile!"],
    [2, 5, 1, 1, 4, "Buon viaggio, un po' di traffico."],
    [3, 4, 2, 2, 5, "Toyota hybrid silenziosissima."],
    [4, 6, 3, 3, 5, "Tesla fantastica, zero emissioni!"],
  ];
  feedbacks.forEach(f =>
    db.run("INSERT OR IGNORE INTO feedback (id,id_autore,id_destinatario,id_viaggio,voto,commento) VALUES (?,?,?,?,?,?)", f)
  );
}

// ── Test endpoint ─────────────────────────────────────────────────────────────
app.get("/test", (_, res) => res.json({ success: true, message: "Server attivo!" }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api",           require("./routes/auth")(db));      // POST /api/register, /api/login
app.use("/api/trips",     require("./routes/trips")(db));
app.use("/api/bookings",  require("./routes/bookings")(db));
app.use("/api/vehicles",  require("./routes/vehicles")(db));
app.use("/api/feedback",  require("./routes/feedback")(db));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚗 SmartCity backend in ascolto su http://localhost:${PORT}`);
});
