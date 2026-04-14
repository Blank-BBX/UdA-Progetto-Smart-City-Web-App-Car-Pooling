const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // GET /api/bookings?id_passeggero=X
  router.get("/", (req, res) => {
    const { id_passeggero } = req.query;
    if (!id_passeggero) return res.json({ success: false, message: "id_passeggero richiesto.", bookings: [] });

    const sql = `
      SELECT
        p.id AS prenotazione_id, p.stato, p.id_viaggio AS id,
        v.citta_partenza, v.citta_arrivo, v.data_viaggio, v.ora_partenza, v.ora_arrivo,
        u.id AS offerente_id, u.nome AS offerente_nome, u.cognome AS offerente_cognome,
        ROUND(AVG(f.voto), 1) AS voto_medio_autista,
        (SELECT 1 FROM feedback fb WHERE fb.id_autore = ? AND fb.id_viaggio = v.id LIMIT 1) AS feedback_dato
      FROM prenotazioni p
      JOIN viaggi v ON p.id_viaggio = v.id
      JOIN utenti u ON v.id_utente = u.id
      LEFT JOIN feedback f ON f.id_destinatario = u.id
      WHERE p.id_passeggero = ?
      GROUP BY p.id
      ORDER BY v.data_viaggio DESC, v.ora_partenza DESC
    `;
    db.all(sql, [id_passeggero, id_passeggero], (err, rows) => {
      if (err) return res.json({ success: false, message: "Errore DB.", bookings: [] });
      res.json({ success: true, bookings: rows });
    });
  });

  // POST /api/bookings — prenota viaggio
  router.post("/", (req, res) => {
    const { id_viaggio, id_passeggero } = req.body;
    if (!id_viaggio || !id_passeggero)
      return res.json({ success: false, message: "Dati mancanti." });

    // Check: il passeggero è l'autista?
    db.get("SELECT id_utente FROM viaggi WHERE id = ?", [id_viaggio], (err, trip) => {
      if (err || !trip) return res.json({ success: false, message: "Viaggio non trovato." });
      if (trip.id_utente === Number(id_passeggero))
        return res.json({ success: false, message: "Non puoi prenotare il tuo stesso viaggio." });

      // Check prenotazione duplicata
      db.get(
        "SELECT id FROM prenotazioni WHERE id_viaggio = ? AND id_passeggero = ? AND stato != 'rifiutata'",
        [id_viaggio, id_passeggero],
        (err2, existing) => {
          if (err2) return res.json({ success: false, message: "Errore DB." });
          if (existing) return res.json({ success: false, message: "Hai già prenotato questo viaggio." });

          // Check posti liberi
          db.get(
            `SELECT (v.posti - COUNT(p.id)) AS liberi
             FROM viaggi v LEFT JOIN prenotazioni p ON p.id_viaggio = v.id AND p.stato IN ('in_attesa','accettata')
             WHERE v.id = ? GROUP BY v.id`,
            [id_viaggio],
            (err3, seat) => {
              if (err3 || !seat || seat.liberi <= 0)
                return res.json({ success: false, message: "Nessun posto disponibile." });

              db.run(
                "INSERT INTO prenotazioni (id_viaggio, id_passeggero, stato) VALUES (?, ?, 'in_attesa')",
                [id_viaggio, id_passeggero],
                function (err4) {
                  if (err4) return res.json({ success: false, message: "Errore durante la prenotazione." });
                  res.json({ success: true, id: this.lastID });
                }
              );
            }
          );
        }
      );
    });
  });

  return router;
};
