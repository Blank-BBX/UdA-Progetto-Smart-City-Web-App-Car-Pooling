const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");

const app = express();
const port = 5000;

console.log("Avvio backend...");

// -------------------------
// DATABASE
// -------------------------
const db = new sqlite3.Database("database.db", (err) => {
  if (err) {
    console.log("Errore database:", err.message);
  } else {
    console.log("Database SQLite connesso correttamente.");
    initDB();
  }
});

function initDB() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS utenti (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      nome     TEXT NOT NULL,
      cognome  TEXT NOT NULL,
      email    TEXT NOT NULL UNIQUE,
      telefono TEXT,
      password TEXT NOT NULL
    )`);

    // Un utente diventa "autista" quando ha almeno un veicolo registrato
    db.run(`CREATE TABLE IF NOT EXISTS veicoli (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      id_utente INTEGER NOT NULL,
      modello   TEXT NOT NULL,
      targa     TEXT NOT NULL,
      posti     INTEGER NOT NULL DEFAULT 4,
      foto      TEXT,
      FOREIGN KEY (id_utente) REFERENCES utenti(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS viaggi (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      id_utente      INTEGER NOT NULL,
      citta_partenza TEXT NOT NULL,
      citta_arrivo   TEXT NOT NULL,
      data_viaggio   TEXT NOT NULL,
      ora_partenza   TEXT NOT NULL,
      ora_arrivo     TEXT NOT NULL,
      posti          INTEGER NOT NULL,
      descrizione    TEXT,
      FOREIGN KEY (id_utente) REFERENCES utenti(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS prenotazioni (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      id_viaggio    INTEGER NOT NULL,
      id_passeggero INTEGER NOT NULL,
      stato         TEXT CHECK(stato IN ('in_attesa','accettata','rifiutata')) DEFAULT 'in_attesa',
      FOREIGN KEY (id_viaggio)    REFERENCES viaggi(id),
      FOREIGN KEY (id_passeggero) REFERENCES utenti(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS feedback (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      id_autore       INTEGER NOT NULL,
      id_destinatario INTEGER NOT NULL,
      id_viaggio      INTEGER NOT NULL,
      voto            INTEGER CHECK(voto BETWEEN 1 AND 5),
      commento        TEXT,
      FOREIGN KEY (id_autore)       REFERENCES utenti(id),
      FOREIGN KEY (id_destinatario) REFERENCES utenti(id),
      FOREIGN KEY (id_viaggio)      REFERENCES viaggi(id)
    )`);

    console.log("Tabelle DB inizializzate.");

    // Migrations: aggiunge colonne mancanti nelle tabelle gia esistenti
    const migrations = [
      `ALTER TABLE viaggi ADD COLUMN id_utente INTEGER`,
      `ALTER TABLE viaggi ADD COLUMN ora_arrivo TEXT`,
      `ALTER TABLE viaggi ADD COLUMN descrizione TEXT`,
      `ALTER TABLE veicoli ADD COLUMN posti INTEGER NOT NULL DEFAULT 4`,
    ];
    migrations.forEach(m => {
      db.run(m, (err) => {
        if (err && !err.message.includes("duplicate column")) {
          console.log("Migration warning:", err.message);
        }
      });
    });
  });
}

function hashPassword(pwd) {
  return crypto.createHash("sha256").update(pwd).digest("hex");
}

// Helper: data/ora corrente come stringhe
function todayStr() { return new Date().toISOString().split("T")[0]; }
function nowStr()   { return new Date().toTimeString().slice(0, 5); }

// -------------------------
// MIDDLEWARE
// -------------------------
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());
app.use((req, res, next) => {
  console.log("Richiesta:", req.method, req.url);
  next();
});

// -------------------------
// TEST / ROOT
// -------------------------
app.get("/test", (req, res) => {
  db.get("SELECT 1", (err) => {
    if (err) return res.json({ success: false, message: "Errore DB" });
    res.json({ success: true });
  });
});

app.get("/", (req, res) => res.send("Backend car pooling attivo"));

// -------------------------
// HELPER: controlla se utente è autista (ha almeno un veicolo)
// -------------------------
function isAutista(userId, callback) {
  db.get(
    "SELECT COUNT(*) as cnt FROM veicoli WHERE id_utente = ?",
    [userId],
    (err, row) => {
      if (err) return callback(false);
      callback(row.cnt > 0);
    }
  );
}

// -------------------------
// REGISTRAZIONE
// -------------------------
app.post("/api/register", (req, res) => {
  const { nome, cognome, email, password, telefono } = req.body;

  if (!nome || !cognome || !email || !password) {
    return res.status(400).json({ success: false, message: "Campi obbligatori mancanti." });
  }

  db.get("SELECT id FROM utenti WHERE email = ?", [email], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: "Errore interno." });
    if (row) return res.status(409).json({ success: false, message: "Email già registrata." });

    const hashedPwd = hashPassword(password);
    db.run(
      "INSERT INTO utenti (nome, cognome, email, password, telefono) VALUES (?, ?, ?, ?, ?)",
      [nome, cognome, email, hashedPwd, telefono || null],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: "Errore durante la registrazione." });
        res.json({ success: true, message: "Registrazione completata!", userId: this.lastID });
      }
    );
  });
});

// -------------------------
// LOGIN
// -------------------------
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email e password obbligatorie." });
  }

  const hashedPwd = hashPassword(password);
  db.get(
    "SELECT id, nome, cognome, email, telefono FROM utenti WHERE email = ? AND password = ?",
    [email, hashedPwd],
    (err, row) => {
      if (err) return res.status(500).json({ success: false, message: "Errore interno." });
      if (!row) return res.status(401).json({ success: false, message: "Credenziali non valide." });

      isAutista(row.id, (autista) => {
        res.json({
          success: true,
          message: "Login effettuato!",
          user: {
            id: row.id,
            nome: row.nome,
            cognome: row.cognome,
            email: row.email,
            telefono: row.telefono,
            tipo: autista ? "autista" : "passeggero"
          }
        });
      });
    }
  );
});

// -------------------------
// PROFILO UTENTE
// GET /api/users/:id
// -------------------------
app.get("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  db.get(
    "SELECT id, nome, cognome, email, telefono FROM utenti WHERE id = ?",
    [userId],
    (err, row) => {
      if (err || !row) return res.status(404).json({ success: false, message: "Utente non trovato." });

      isAutista(row.id, (autista) => {
        res.json({
          success: true,
          user: { ...row, tipo: autista ? "autista" : "passeggero" }
        });
      });
    }
  );
});

// -------------------------
// VEICOLI
// -------------------------

// GET /api/vehicles?id_utente=X
app.get("/api/vehicles", (req, res) => {
  const { id_utente } = req.query;
  if (!id_utente) return res.status(400).json({ success: false, message: "id_utente richiesto." });

  db.all(
    "SELECT id, modello, targa, posti FROM veicoli WHERE id_utente = ? ORDER BY id DESC",
    [id_utente],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Errore interno." });
      res.json({ success: true, vehicles: rows });
    }
  );
});

// POST /api/vehicles
app.post("/api/vehicles", (req, res) => {
  const { id_utente, modello, targa, posti } = req.body;
  if (!id_utente || !modello || !targa || !posti) {
    return res.status(400).json({ success: false, message: "Campi obbligatori mancanti." });
  }

  db.run(
    "INSERT INTO veicoli (id_utente, modello, targa, posti) VALUES (?, ?, ?, ?)",
    [id_utente, modello, targa, Number(posti)],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: "Errore durante il salvataggio." });
      res.json({ success: true, message: "Veicolo aggiunto!", vehicleId: this.lastID });
    }
  );
});

// DELETE /api/vehicles/:id
app.delete("/api/vehicles/:id", (req, res) => {
  const vehicleId = req.params.id;
  const { id_utente } = req.body;

  db.run(
    "DELETE FROM veicoli WHERE id = ? AND id_utente = ?",
    [vehicleId, id_utente],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: "Errore durante la rimozione." });
      if (this.changes === 0) return res.status(404).json({ success: false, message: "Veicolo non trovato o non autorizzato." });
      res.json({ success: true, message: "Veicolo rimosso." });
    }
  );
});

// -------------------------
// VIAGGI
// -------------------------

// GET /api/trips — tutti i viaggi con filtri opzionali
app.get("/api/trips", (req, res) => {
  const { from, to, date } = req.query;

  let sql = `
    SELECT
      v.id,
      v.citta_partenza,
      v.citta_arrivo,
      v.data_viaggio,
      v.ora_partenza,
      v.ora_arrivo,
      v.posti,
      v.descrizione,
      u.id      AS offerente_id,
      u.nome    AS offerente_nome,
      u.cognome AS offerente_cognome,
      COALESCE((SELECT COUNT(*) FROM prenotazioni p
       WHERE p.id_viaggio = v.id AND p.stato IN ('in_attesa','accettata')), 0) AS prenotazioni_attive,
      COALESCE((SELECT ROUND(AVG(f.voto),1) FROM feedback f WHERE f.id_destinatario = v.id_utente), 0) AS voto_medio_autista,
      (SELECT COUNT(*) FROM feedback f WHERE f.id_destinatario = v.id_utente) AS num_feedback
    FROM viaggi v
    LEFT JOIN utenti u ON u.id = v.id_utente
    WHERE 1=1
  `;
  const params = [];

  if (from) { sql += " AND lower(v.citta_partenza) LIKE lower(?)"; params.push(`%${from}%`); }
  if (to)   { sql += " AND lower(v.citta_arrivo)   LIKE lower(?)"; params.push(`%${to}%`); }
  if (date) { sql += " AND v.data_viaggio = ?";                     params.push(date); }

  sql += " ORDER BY v.data_viaggio ASC, v.ora_partenza ASC";

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Errore GET /api/trips:", err.message);
      return res.status(500).json({ success: false, message: "Errore interno: " + err.message });
    }
    const trips = rows.map(r => ({ ...r, posti_liberi: r.posti - (r.prenotazioni_attive || 0) }));
    res.json({ success: true, trips });
  });
});

// POST /api/trips — solo autisti
app.post("/api/trips", (req, res) => {
  const { id_utente, citta_partenza, citta_arrivo, data_viaggio, ora_partenza, ora_arrivo, posti, descrizione } = req.body;

  if (!id_utente || !citta_partenza || !citta_arrivo || !data_viaggio || !ora_partenza || !ora_arrivo || !posti) {
    return res.status(400).json({ success: false, message: "Campi obbligatori mancanti." });
  }

  isAutista(id_utente, (autista) => {
    if (!autista) {
      return res.status(403).json({
        success: false,
        message: "Solo gli autisti possono offrire viaggi. Registra prima un veicolo nel tuo profilo."
      });
    }

    db.run(
      `INSERT INTO viaggi (id_utente, citta_partenza, citta_arrivo, data_viaggio, ora_partenza, ora_arrivo, posti, descrizione)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_utente, citta_partenza, citta_arrivo, data_viaggio, ora_partenza, ora_arrivo, posti, descrizione || null],
      function (err) {
        if (err) {
          console.error("Errore INSERT viaggi:", err.message);
          return res.status(500).json({ success: false, message: "Errore durante la creazione del viaggio: " + err.message });
        }
        res.json({ success: true, message: "Viaggio creato!", tripId: this.lastID });
      }
    );
  });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/trips/offered?id_autista=X
// Restituisce i viaggi GIA' EFFETTUATI offerti dall'autista,
// con i passeggeri che vi hanno partecipato e il flag feedback_dato.
// IMPORTANTE: questo route va registrato PRIMA di /api/trips/:id
// ─────────────────────────────────────────────────────────────────
app.get("/api/trips/offered", (req, res) => {
  const { id_autista } = req.query;
  if (!id_autista) return res.status(400).json({ success: false, message: "id_autista richiesto." });

  const today = todayStr();
  const now   = nowStr();

  // Recupera i viaggi passati dell'autista
  db.all(
    `SELECT v.id, v.citta_partenza, v.citta_arrivo, v.data_viaggio, v.ora_partenza, v.ora_arrivo
     FROM viaggi v
     WHERE v.id_utente = ?
       AND (
         v.data_viaggio < ?
         OR (v.data_viaggio = ? AND v.ora_partenza < ?)
       )
     ORDER BY v.data_viaggio DESC, v.ora_partenza DESC`,
    [id_autista, today, today, now],
    (err, trips) => {
      if (err) {
        console.error("Errore GET /api/trips/offered:", err.message);
        return res.status(500).json({ success: false, message: "Errore interno." });
      }
      if (!trips || trips.length === 0) return res.json({ success: true, trips: [] });

      let done = 0;
      const result = [];

      trips.forEach(trip => {
        // Per ogni viaggio recupera i passeggeri e se l'autista li ha già valutati
        db.all(
          `SELECT
             pr.id  AS prenotazione_id,
             pr.stato,
             u.id   AS passeggero_id,
             u.nome AS passeggero_nome,
             u.cognome AS passeggero_cognome,
             (SELECT id FROM feedback
              WHERE id_autore       = ?
                AND id_destinatario = u.id
                AND id_viaggio      = ?) AS feedback_dato
           FROM prenotazioni pr
           JOIN utenti u ON u.id = pr.id_passeggero
           WHERE pr.id_viaggio = ?
             AND pr.stato IN ('in_attesa','accettata')`,
          [id_autista, trip.id, trip.id],
          (err2, passengers) => {
            result.push({ ...trip, passengers: passengers || [] });
            done++;
            if (done === trips.length) {
              result.sort((a, b) => b.data_viaggio.localeCompare(a.data_viaggio));
              res.json({ success: true, trips: result });
            }
          }
        );
      });
    }
  );
});

// -------------------------
// PRENOTAZIONI
// -------------------------
app.post("/api/bookings", (req, res) => {
  const { id_viaggio, id_passeggero } = req.body;

  if (!id_viaggio || !id_passeggero) {
    return res.status(400).json({ success: false, message: "Dati mancanti." });
  }

  db.get(
    `SELECT v.posti, v.id_utente,
       (SELECT COUNT(*) FROM prenotazioni p WHERE p.id_viaggio = v.id AND p.stato IN ('in_attesa','accettata')) AS prenotati
     FROM viaggi v WHERE v.id = ?`,
    [id_viaggio],
    (err, viaggio) => {
      if (err || !viaggio) return res.status(404).json({ success: false, message: "Viaggio non trovato." });

      if (viaggio.id_utente === id_passeggero) {
        return res.status(400).json({ success: false, message: "Non puoi prenotare il tuo stesso viaggio." });
      }
      if (viaggio.posti - viaggio.prenotati <= 0) {
        return res.status(409).json({ success: false, message: "Nessun posto disponibile." });
      }

      db.get(
        "SELECT id FROM prenotazioni WHERE id_viaggio = ? AND id_passeggero = ?",
        [id_viaggio, id_passeggero],
        (err, existing) => {
          if (existing) return res.status(409).json({ success: false, message: "Hai già prenotato questo viaggio." });

          db.run(
            "INSERT INTO prenotazioni (id_viaggio, id_passeggero) VALUES (?, ?)",
            [id_viaggio, id_passeggero],
            function (err) {
              if (err) return res.status(500).json({ success: false, message: "Errore durante la prenotazione." });
              res.json({ success: true, message: "Prenotazione effettuata!", bookingId: this.lastID });
            }
          );
        }
      );
    }
  );
});

// GET /api/bookings?id_passeggero=X
// Include feedback_dato per sapere se il passeggero ha già valutato l'autista
app.get("/api/bookings", (req, res) => {
  const { id_passeggero } = req.query;
  if (!id_passeggero) {
    return res.status(400).json({ success: false, message: "id_passeggero richiesto." });
  }

  db.all(
    `SELECT
       pr.id AS prenotazione_id,
       pr.stato,
       v.id,
       v.citta_partenza,
       v.citta_arrivo,
       v.data_viaggio,
       v.ora_partenza,
       v.ora_arrivo,
       v.posti,
       v.descrizione,
       u.id      AS offerente_id,
       u.nome    AS offerente_nome,
       u.cognome AS offerente_cognome,
       COALESCE((SELECT ROUND(AVG(f.voto),1) FROM feedback f WHERE f.id_destinatario = u.id), 0) AS voto_medio_autista,
       (SELECT id FROM feedback
        WHERE id_autore       = pr.id_passeggero
          AND id_destinatario = v.id_utente
          AND id_viaggio      = v.id) AS feedback_dato
     FROM prenotazioni pr
     JOIN viaggi v ON v.id = pr.id_viaggio
     LEFT JOIN utenti u ON u.id = v.id_utente
     WHERE pr.id_passeggero = ?
       AND pr.stato IN ('in_attesa','accettata')
     ORDER BY v.data_viaggio DESC, v.ora_partenza DESC`,
    [id_passeggero],
    (err, rows) => {
      if (err) {
        console.error("Errore GET /api/bookings:", err.message);
        return res.status(500).json({ success: false, message: "Errore interno." });
      }
      res.json({ success: true, bookings: rows });
    }
  );
});

// -------------------------
// FEEDBACK
// -------------------------

// POST /api/feedback — con controllo duplicati
app.post("/api/feedback", (req, res) => {
  const { id_autore, id_destinatario, id_viaggio, voto, commento } = req.body;

  if (!id_autore || !id_destinatario || !id_viaggio || !voto) {
    return res.status(400).json({ success: false, message: "Campi obbligatori mancanti." });
  }
  if (voto < 1 || voto > 5) {
    return res.status(400).json({ success: false, message: "Il voto deve essere tra 1 e 5." });
  }
  if (Number(id_autore) === Number(id_destinatario)) {
    return res.status(400).json({ success: false, message: "Non puoi lasciare un feedback a te stesso." });
  }

  // Controllo: il viaggio deve essere già passato
  db.get(
    "SELECT data_viaggio, ora_partenza FROM viaggi WHERE id = ?",
    [id_viaggio],
    (err, trip) => {
      if (err || !trip) {
        return res.status(404).json({ success: false, message: "Viaggio non trovato." });
      }

      const today = todayStr();
      const now   = nowStr();
      const tripIsPast =
        trip.data_viaggio < today ||
        (trip.data_viaggio === today && trip.ora_partenza < now);

      if (!tripIsPast) {
        return res.status(400).json({
          success: false,
          message: "Puoi lasciare un feedback solo per viaggi già conclusi."
        });
      }

      // Controllo: l'autore era realmente parte del viaggio
      // (o era l'autista o era un passeggero prenotato)
      db.get(
        `SELECT 1 FROM viaggi WHERE id = ? AND id_utente = ?
         UNION
         SELECT 1 FROM prenotazioni
         WHERE id_viaggio = ? AND id_passeggero = ? AND stato IN ('in_attesa','accettata')`,
        [id_viaggio, id_autore, id_viaggio, id_autore],
        (err2, partecipante) => {
          if (err2 || !partecipante) {
            return res.status(403).json({
              success: false,
              message: "Non hai partecipato a questo viaggio."
            });
          }

          // Controllo duplicato
          db.get(
            "SELECT id FROM feedback WHERE id_autore = ? AND id_destinatario = ? AND id_viaggio = ?",
            [id_autore, id_destinatario, id_viaggio],
            (err3, existing) => {
              if (err3) return res.status(500).json({ success: false, message: "Errore interno." });
              if (existing) {
                return res.status(409).json({
                  success: false,
                  message: "Hai già lasciato un feedback per questa persona in questo viaggio."
                });
              }

              db.run(
                "INSERT INTO feedback (id_autore, id_destinatario, id_viaggio, voto, commento) VALUES (?, ?, ?, ?, ?)",
                [id_autore, id_destinatario, id_viaggio, voto, commento || null],
                function (err4) {
                  if (err4) return res.status(500).json({ success: false, message: "Errore durante l'invio del feedback." });
                  res.json({ success: true, message: "Feedback inviato!", feedbackId: this.lastID });
                }
              );
            }
          );
        }
      );
    }
  );
});

// GET /api/feedback/:userId — feedback ricevuti da un utente + voto medio
app.get("/api/feedback/:userId", (req, res) => {
  const userId = req.params.userId;
  db.all(
    `SELECT f.id, f.voto, f.commento, f.id_viaggio,
            u.nome AS autore_nome, u.cognome AS autore_cognome,
            v.citta_partenza, v.citta_arrivo, v.data_viaggio
     FROM feedback f
     JOIN utenti u ON u.id = f.id_autore
     LEFT JOIN viaggi v ON v.id = f.id_viaggio
     WHERE f.id_destinatario = ?
     ORDER BY f.id DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error("Errore GET /api/feedback:", err.message);
        return res.status(500).json({ success: false, message: "Errore interno." });
      }
      const votoMedio = rows.length > 0
        ? (rows.reduce((sum, r) => sum + r.voto, 0) / rows.length).toFixed(1)
        : null;
      res.json({ success: true, feedback: rows, votoMedio: votoMedio ? Number(votoMedio) : null });
    }
  );
});

// -------------------------
// AVVIO SERVER
// -------------------------
app.listen(port, () => {
  console.log("Server Express avviato su http://localhost:" + port);
});
