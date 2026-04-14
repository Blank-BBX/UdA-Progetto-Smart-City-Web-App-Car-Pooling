const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // GET /api/feedback/:userId — feedback ricevuti da un utente
  router.get("/:userId", (req, res) => {
    const { userId } = req.params;
    const sql = `
      SELECT
        f.id, f.voto, f.commento,
        u.nome AS autore_nome, u.cognome AS autore_cognome,
        v.citta_partenza, v.citta_arrivo, v.data_viaggio
      FROM feedback f
      JOIN utenti u ON f.id_autore = u.id
      LEFT JOIN viaggi v ON f.id_viaggio = v.id
      WHERE f.id_destinatario = ?
      ORDER BY f.id DESC
    `;
    db.all(sql, [userId], (err, rows) => {
      if (err) return res.json({ success: false, feedback: [], votoMedio: null });
      const votoMedio = rows.length ? rows.reduce((s, r) => s + r.voto, 0) / rows.length : null;
      res.json({ success: true, feedback: rows, votoMedio: votoMedio ? Math.round(votoMedio * 10) / 10 : null });
    });
  });

  // GET /api/feedback/pending/:userId — viaggi passati da valutare
  router.get("/pending/:userId", (req, res) => {
    const { userId } = req.params;
    const today = new Date().toISOString().split("T")[0];
    const now   = new Date().toTimeString().slice(0, 5);

    // Viaggi prenotati passati (per valutare autisti)
    const sqlBookings = `
      SELECT
        v.id, v.citta_partenza, v.citta_arrivo, v.data_viaggio, v.ora_partenza, v.ora_arrivo,
        u.id AS offerente_id, u.nome AS offerente_nome, u.cognome AS offerente_cognome,
        p.id AS prenotazione_id,
        (SELECT 1 FROM feedback fb WHERE fb.id_autore = ? AND fb.id_destinatario = u.id AND fb.id_viaggio = v.id LIMIT 1) AS feedback_dato
      FROM prenotazioni p
      JOIN viaggi v ON p.id_viaggio = v.id
      JOIN utenti u ON v.id_utente = u.id
      WHERE p.id_passeggero = ?
        AND p.stato IN ('in_attesa','accettata')
        AND (v.data_viaggio < ? OR (v.data_viaggio = ? AND v.ora_partenza < ?))
      ORDER BY v.data_viaggio DESC
    `;

    // Viaggi offerti passati con prenotazioni (per valutare passeggeri)
    const sqlOffered = `
      SELECT
        v.id, v.citta_partenza, v.citta_arrivo, v.data_viaggio, v.ora_partenza, v.ora_arrivo,
        p.id_passeggero AS passeggero_id,
        u.nome AS passeggero_nome, u.cognome AS passeggero_cognome,
        (SELECT 1 FROM feedback fb WHERE fb.id_autore = ? AND fb.id_destinatario = p.id_passeggero AND fb.id_viaggio = v.id LIMIT 1) AS feedback_dato
      FROM viaggi v
      JOIN prenotazioni p ON p.id_viaggio = v.id
      JOIN utenti u ON p.id_passeggero = u.id
      WHERE v.id_utente = ?
        AND p.stato IN ('in_attesa','accettata')
        AND (v.data_viaggio < ? OR (v.data_viaggio = ? AND v.ora_partenza < ?))
      ORDER BY v.data_viaggio DESC, p.id
    `;

    db.all(sqlBookings, [userId, userId, today, today, now], (err, bookings) => {
      if (err) return res.json({ success: false, pastBookings: [], offeredTrips: [] });

      db.all(sqlOffered, [userId, userId, today, today, now], (err2, offeredRows) => {
        if (err2) return res.json({ success: true, pastBookings: bookings, offeredTrips: [] });

        // Raggruppa passeggeri per viaggio
        const tripMap = {};
        for (const row of offeredRows) {
          if (!tripMap[row.id]) {
            tripMap[row.id] = {
              id: row.id, citta_partenza: row.citta_partenza, citta_arrivo: row.citta_arrivo,
              data_viaggio: row.data_viaggio, ora_partenza: row.ora_partenza, ora_arrivo: row.ora_arrivo,
              passengers: [],
            };
          }
          tripMap[row.id].passengers.push({
            passeggero_id: row.passeggero_id,
            passeggero_nome: row.passeggero_nome,
            passeggero_cognome: row.passeggero_cognome,
            feedback_dato: row.feedback_dato,
          });
        }

        res.json({ success: true, pastBookings: bookings, offeredTrips: Object.values(tripMap) });
      });
    });
  });

  // POST /api/feedback — invia feedback
  router.post("/", (req, res) => {
    const { id_autore, id_destinatario, id_viaggio, voto, commento } = req.body;
    if (!id_autore || !id_destinatario || !id_viaggio || !voto)
      return res.json({ success: false, message: "Dati mancanti." });
    if (voto < 1 || voto > 5)
      return res.json({ success: false, message: "Voto non valido (1-5)." });

    // Check duplicato
    db.get(
      "SELECT id FROM feedback WHERE id_autore = ? AND id_destinatario = ? AND id_viaggio = ?",
      [id_autore, id_destinatario, id_viaggio],
      (err, existing) => {
        if (err) return res.json({ success: false, message: "Errore DB." });
        if (existing) return res.json({ success: false, message: "Hai già lasciato un feedback per questo viaggio." });

        db.run(
          "INSERT INTO feedback (id_autore, id_destinatario, id_viaggio, voto, commento) VALUES (?, ?, ?, ?, ?)",
          [id_autore, id_destinatario, id_viaggio, voto, commento?.trim() || null],
          function (err2) {
            if (err2) return res.json({ success: false, message: "Errore durante il salvataggio." });
            res.json({ success: true, id: this.lastID });
          }
        );
      }
    );
  });

  return router;
};
