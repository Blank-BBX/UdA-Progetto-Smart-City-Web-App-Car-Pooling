const express = require("express");
const router = express.Router();

const VALID_FUELS = ["benzina", "diesel", "gpl", "metano", "ibrido", "elettrico"];

module.exports = (db) => {
  // GET /api/vehicles?id_utente=X
  router.get("/", (req, res) => {
    const { id_utente } = req.query;
    if (!id_utente) return res.json({ success: false, message: "id_utente richiesto.", vehicles: [] });

    db.all(
      "SELECT id, modello, targa, posti, carburante FROM veicoli WHERE id_utente = ?",
      [id_utente],
      (err, rows) => {
        if (err) return res.json({ success: false, message: "Errore DB.", vehicles: [] });
        res.json({ success: true, vehicles: rows });
      }
    );
  });

  // POST /api/vehicles — aggiunge veicolo
  router.post("/", (req, res) => {
    const { id_utente, modello, targa, posti, carburante } = req.body;
    if (!id_utente || !modello || !targa || !posti)
      return res.json({ success: false, message: "Campi obbligatori mancanti." });

    const fuel = VALID_FUELS.includes(carburante) ? carburante : "benzina";

    // Targa univoca
    db.get("SELECT id FROM veicoli WHERE targa = ?", [targa.toUpperCase()], (err, existing) => {
      if (err) return res.json({ success: false, message: "Errore DB." });
      if (existing) return res.json({ success: false, message: "Targa già registrata." });

      db.run(
        "INSERT INTO veicoli (id_utente, modello, targa, posti, carburante) VALUES (?, ?, ?, ?, ?)",
        [id_utente, modello.trim(), targa.toUpperCase().trim(), Number(posti), fuel],
        function (err2) {
          if (err2) return res.json({ success: false, message: "Errore durante il salvataggio." });

          // Aggiorna tipo utente ad autista
          db.run("UPDATE utenti SET tipo = 'autista' WHERE id = ?", [id_utente]);
          res.json({ success: true, id: this.lastID });
        }
      );
    });
  });

  // DELETE /api/vehicles/:id
  router.delete("/:id", (req, res) => {
    const { id_utente } = req.body;
    const vehicleId = req.params.id;
    if (!id_utente) return res.json({ success: false, message: "id_utente richiesto." });

    db.run(
      "DELETE FROM veicoli WHERE id = ? AND id_utente = ?",
      [vehicleId, id_utente],
      function (err) {
        if (err) return res.json({ success: false, message: "Errore durante la rimozione." });
        if (this.changes === 0) return res.json({ success: false, message: "Veicolo non trovato." });

        // Se non ha più veicoli → torna passeggero
        db.get("SELECT COUNT(*) AS n FROM veicoli WHERE id_utente = ?", [id_utente], (err2, row) => {
          if (!err2 && row.n === 0)
            db.run("UPDATE utenti SET tipo = 'passeggero' WHERE id = ?", [id_utente]);
          res.json({ success: true });
        });
      }
    );
  });

  return router;
};
