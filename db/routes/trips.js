const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // GET /api/trips — lista viaggi (con filtri opzionali)
  router.get("/", (req, res) => {
    const { from, to, date } = req.query;
    let sql = `
      SELECT
        v.id, v.citta_partenza, v.citta_arrivo, v.data_viaggio,
        v.ora_partenza, v.ora_arrivo, v.posti, v.descrizione,
        u.id AS offerente_id, u.nome AS offerente_nome, u.cognome AS offerente_cognome,
        ve.carburante AS carburante_veicolo,
        (v.posti - COALESCE(
          (SELECT COUNT(*) FROM prenotazioni p
           WHERE p.id_viaggio = v.id AND p.stato IN ('in_attesa','accettata')), 0
        )) AS posti_liberi,
        ROUND(AVG(f.voto), 1) AS voto_medio_autista,
        COUNT(f.id) AS num_feedback
      FROM viaggi v
      JOIN utenti u ON v.id_utente = u.id
      LEFT JOIN veicoli ve ON v.id_veicolo = ve.id
      LEFT JOIN feedback f ON f.id_destinatario = u.id
    `;
    const params = [];
    const where = [];
    if (from) { where.push("LOWER(v.citta_partenza) LIKE ?"); params.push(`%${from.toLowerCase()}%`); }
    if (to)   { where.push("LOWER(v.citta_arrivo) LIKE ?");   params.push(`%${to.toLowerCase()}%`); }
    if (date) { where.push("v.data_viaggio = ?");             params.push(date); }
    if (where.length) sql += " WHERE " + where.join(" AND ");
    sql += " GROUP BY v.id ORDER BY v.data_viaggio ASC, v.ora_partenza ASC";

    db.all(sql, params, (err, rows) => {
      if (err) return res.json({ success: false, message: "Errore DB.", trips: [] });
      res.json({ success: true, trips: rows });
    });
  });

  // POST /api/trips — crea viaggio
  router.post("/", (req, res) => {
    const { id_utente, id_veicolo, citta_partenza, citta_arrivo, data_viaggio, ora_partenza, ora_arrivo, posti, descrizione } = req.body;
    if (!id_utente || !citta_partenza || !citta_arrivo || !data_viaggio || !ora_partenza || !ora_arrivo)
      return res.json({ success: false, message: "Campi obbligatori mancanti." });

    db.run(
      `INSERT INTO viaggi (id_utente, id_veicolo, citta_partenza, citta_arrivo, data_viaggio, ora_partenza, ora_arrivo, posti, descrizione)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_utente, id_veicolo || null, citta_partenza.trim(), citta_arrivo.trim(), data_viaggio, ora_partenza, ora_arrivo, posti || 3, descrizione?.trim() || null],
      function (err) {
        if (err) return res.json({ success: false, message: "Errore durante la creazione del viaggio." });
        res.json({ success: true, id: this.lastID });
      }
    );
  });

  return router;
};
