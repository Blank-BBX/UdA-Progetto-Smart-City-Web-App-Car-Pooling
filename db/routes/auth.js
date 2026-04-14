const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const sha256 = (str) => crypto.createHash("sha256").update(str).digest("hex");

module.exports = (db) => {
  // POST /api/register
  router.post("/register", (req, res) => {
    const { nome, cognome, email, password, telefono } = req.body;
    if (!nome || !cognome || !email || !password)
      return res.json({ success: false, message: "Campi obbligatori mancanti." });

    db.get("SELECT id FROM utenti WHERE email = ?", [email.toLowerCase()], (err, row) => {
      if (err) return res.json({ success: false, message: "Errore DB." });
      if (row) return res.json({ success: false, message: "Email già registrata." });

      const hash = sha256(password);
      db.run(
        "INSERT INTO utenti (nome, cognome, email, password, telefono, tipo) VALUES (?, ?, ?, ?, ?, 'passeggero')",
        [nome.trim(), cognome.trim(), email.toLowerCase().trim(), hash, telefono?.trim() || null],
        function (err2) {
          if (err2) return res.json({ success: false, message: "Errore durante la registrazione." });
          res.json({ success: true, message: "Registrazione completata." });
        }
      );
    });
  });

  // POST /api/login
  router.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
      return res.json({ success: false, message: "Email e password obbligatori." });

    const hash = sha256(password);
    db.get(
      "SELECT id, nome, cognome, email, telefono, tipo FROM utenti WHERE email = ? AND password = ?",
      [email.toLowerCase().trim(), hash],
      (err, row) => {
        if (err) return res.json({ success: false, message: "Errore DB." });
        if (!row) return res.json({ success: false, message: "Credenziali non valide." });
        res.json({ success: true, user: row });
      }
    );
  });

  return router;
};
