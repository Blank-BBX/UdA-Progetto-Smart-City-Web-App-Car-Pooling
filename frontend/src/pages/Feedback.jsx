import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";

const TODAY = new Date().toISOString().split("T")[0];
const NOW   = new Date().toTimeString().slice(0, 5);

function isPast(t) {
  if (!t) return false;
  if (t.data_viaggio < TODAY) return true;
  if (t.data_viaggio === TODAY) return (t.ora_partenza || "23:59") < NOW;
  return false;
}

function StarPicker({ value, onChange, disabled, theme }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          disabled={disabled}
          style={{
            width: "36px", height: "36px", borderRadius: "8px", border: "none",
            background: n <= (hovered || value) ? "#fbbf24" : theme.surfaceAlt,
            color:      n <= (hovered || value) ? "#78350f" : theme.textLight,
            fontSize: "1.1rem", cursor: disabled ? "default" : "pointer",
            fontWeight: 700,
          }}
          onMouseEnter={() => !disabled && setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => !disabled && onChange(n)}
        >★</button>
      ))}
    </div>
  );
}

function PassengerFeedbackCard({ booking, userId, onSent, theme }) {
  const [voto, setVoto]         = useState(5);
  const [commento, setCommento] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const alreadyDone = !!booking.feedback_dato;

  const send = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_autore: userId, id_destinatario: booking.offerente_id, id_viaggio: booking.id, voto, commento }),
      });
      const data = await res.json();
      if (data.success) onSent(booking.id);
      else setError(data.message || "Errore nell'invio.");
    } catch { setError("Impossibile contattare il server."); }
    finally { setLoading(false); }
  };

  const cardStyle = {
    background: alreadyDone ? theme.success : theme.surfaceAlt,
    border: `1.5px solid ${alreadyDone ? theme.successBorder : theme.border}`,
    borderRadius: "14px", padding: "18px 20px",
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", gap: "8px" }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: "1.05rem", color: theme.text }}>
            <strong>{booking.citta_partenza}</strong>
            <span style={{ color: theme.primary, fontWeight: 700 }}> ➜ </span>
            <strong>{booking.citta_arrivo}</strong>
          </p>
          <p style={{ margin: 0, fontSize: "0.82rem", color: theme.textMuted }}>
            📅 {booking.data_viaggio} &nbsp;·&nbsp; 🕐 {booking.ora_partenza} → {booking.ora_arrivo}
          </p>
        </div>
        {alreadyDone
          ? <span style={{ padding: "4px 12px", borderRadius: "20px", background: theme.success, color: theme.successText, fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" }}>✅ Valutato</span>
          : <span style={{ padding: "4px 12px", borderRadius: "20px", background: theme.warning, color: theme.warningText, fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" }}>⏳ In attesa</span>
        }
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: theme.info, color: theme.infoText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700, flexShrink: 0, textTransform: "uppercase" }}>
          {booking.offerente_nome?.[0]}{booking.offerente_cognome?.[0]}
        </div>
        <div>
          <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "0.92rem", color: theme.text }}>🚙 {booking.offerente_nome} {booking.offerente_cognome}</p>
          <p style={{ margin: 0, fontSize: "0.78rem", color: theme.textMuted }}>Autista del viaggio</p>
        </div>
      </div>

      {alreadyDone ? (
        <p style={{ margin: 0, color: theme.successText, fontSize: "0.85rem", fontStyle: "italic" }}>Hai già lasciato una recensione per questo viaggio.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <StarPicker value={voto} onChange={setVoto} disabled={false} theme={theme} />
            <span style={{ fontWeight: 700, color: "#92400e", fontSize: "0.9rem" }}>{voto}/5</span>
          </div>
          <textarea
            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1.5px solid ${theme.border}`, fontSize: "0.88rem", resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit", background: theme.surface, color: theme.text }}
            placeholder="Commento facoltativo… (puntualità, gentilezza, auto pulita…)"
            value={commento} onChange={e => setCommento(e.target.value)} rows={2}
          />
          {error && <p style={{ margin: "0 0 6px", color: theme.errorText, fontSize: "0.82rem" }}>{error}</p>}
          <button
            style={{ alignSelf: "flex-start", padding: "9px 22px", borderRadius: "9px", border: "none", background: theme.primary, color: "#fff", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", opacity: loading ? 0.6 : 1 }}
            onClick={send} disabled={loading}
          >
            {loading ? "Invio…" : "Invia feedback"}
          </button>
        </div>
      )}
    </div>
  );
}

function DriverFeedbackCard({ trip, passenger, userId, theme }) {
  const [voto, setVoto]         = useState(5);
  const [commento, setCommento] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [localDone, setLocalDone] = useState(false);
  const alreadyDone = !!passenger.feedback_dato || localDone;

  const send = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_autore: userId, id_destinatario: passenger.passeggero_id, id_viaggio: trip.id, voto, commento }),
      });
      const data = await res.json();
      if (data.success) setLocalDone(true);
      else setError(data.message || "Errore nell'invio.");
    } catch { setError("Impossibile contattare il server."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", borderBottom: `1px solid ${theme.border}`, flexWrap: "wrap", background: alreadyDone ? theme.success : "transparent" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "180px" }}>
        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: theme.success, color: theme.successText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700, flexShrink: 0, textTransform: "uppercase" }}>
          {passenger.passeggero_nome?.[0]}{passenger.passeggero_cognome?.[0]}
        </div>
        <div>
          <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "0.88rem", color: theme.text }}>👤 {passenger.passeggero_nome} {passenger.passeggero_cognome}</p>
          <p style={{ margin: 0, fontSize: "0.75rem", color: theme.textMuted }}>Passeggero</p>
        </div>
      </div>

      {alreadyDone ? (
        <span style={{ padding: "4px 12px", borderRadius: "20px", background: theme.success, color: theme.successText, fontSize: "0.78rem", fontWeight: 700 }}>✅ Valutato</span>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", flex: 1 }}>
          <StarPicker value={voto} onChange={setVoto} disabled={false} theme={theme} />
          <input
            style={{ flex: 1, minWidth: "140px", padding: "7px 10px", borderRadius: "7px", border: `1.5px solid ${theme.border}`, fontSize: "0.85rem", outline: "none", background: theme.surface, color: theme.text }}
            placeholder="Commento (opzionale)"
            value={commento} onChange={e => setCommento(e.target.value)}
          />
          {error && <p style={{ margin: 0, color: theme.errorText, fontSize: "0.82rem" }}>{error}</p>}
          <button
            style={{ padding: "7px 16px", borderRadius: "7px", border: "none", background: theme.primary, color: "#fff", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", whiteSpace: "nowrap", opacity: loading ? 0.6 : 1 }}
            onClick={send} disabled={loading}
          >
            {loading ? "…" : "Invia"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Feedback({ user, setPage }) {
  const { theme } = useTheme();
  const [pastBookings, setPastBookings] = useState([]);
  const [offeredTrips, setOfferedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localDoneBookings, setLocalDoneBookings] = useState(new Set());

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/feedback/pending/${user.id}`);
      const data = await res.json();
      setPastBookings(data.pastBookings ?? []);
      setOfferedTrips(data.offeredTrips ?? []);
    } catch {
      setPastBookings([]); setOfferedTrips([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const s = makeStyles(theme);

  if (!user) {
    return (
      <div style={s.wrapper}>
        <div style={s.gateCard}>
          <span style={{ fontSize: "2.8rem" }}>⭐</span>
          <h3 style={s.gateTitle}>Accedi per lasciare un feedback</h3>
          <p style={s.gateSub}>Le recensioni aiutano la community a viaggiare in sicurezza.</p>
          <button style={s.btnPrimary} onClick={() => setPage("login")}>Vai al Login</button>
          <button style={s.btnSecondary} onClick={() => setPage("register")}>Registrati</button>
        </div>
      </div>
    );
  }

  const pendingPassenger = pastBookings.filter(b => !b.feedback_dato && !localDoneBookings.has(b.id)).length;
  const pendingDriver    = offeredTrips.reduce((acc, t) => acc + (t.passengers || []).filter(p => !p.feedback_dato).length, 0);

  if (loading) {
    return (
      <div style={s.wrapper}>
        <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "36px", height: "36px", border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: theme.textMuted, marginTop: "12px" }}>Caricamento viaggi…</p>
        </div>
      </div>
    );
  }

  const hasAnything = pastBookings.length > 0 || offeredTrips.some(t => t.passengers?.length > 0);

  return (
    <div style={s.wrapper}>
      <div style={s.container}>
        <div style={s.header}>
          <div>
            <h2 style={s.title}>⭐ Lascia un Feedback</h2>
            <p style={s.subtitle}>Valuta chi ha condiviso il viaggio con te.</p>
          </div>
          {(pendingPassenger + pendingDriver) > 0 && (
            <div style={s.pendingPill}>
              <span style={s.pendingNum}>{pendingPassenger + pendingDriver}</span>
              <span style={s.pendingLbl}>in attesa</span>
            </div>
          )}
        </div>

        {!hasAnything && (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <p style={{ fontSize: "3rem", margin: "0 0 12px" }}>🚗</p>
            <h3 style={{ margin: "0 0 8px", color: theme.text }}>Nessun viaggio da valutare</h3>
            <p style={{ color: theme.textMuted, margin: "0 0 24px", fontSize: "0.9rem" }}>
              I feedback si sbloccano dopo aver effettuato un viaggio.
            </p>
            <button style={s.btnPrimary} onClick={() => setPage("search")}>Cerca un viaggio</button>
          </div>
        )}

        {/* Sezione passeggero: valuta autisti */}
        {pastBookings.length > 0 && (
          <section style={s.section}>
            <div style={s.sectionHeader}>
              <div style={{ ...s.sectionIcon, background: theme.info }}>🧑‍💼</div>
              <div>
                <h3 style={s.sectionTitle}>Valuta gli autisti</h3>
                <p style={s.sectionSub}>Viaggi che hai prenotato e già effettuato</p>
              </div>
              {pendingPassenger > 0 && <span style={s.sectionBadge}>{pendingPassenger} da fare</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {pastBookings.map(b => (
                <PassengerFeedbackCard
                  key={`booking-${b.prenotazione_id}`}
                  booking={{ ...b, feedback_dato: b.feedback_dato || localDoneBookings.has(b.id) || undefined }}
                  userId={user.id}
                  onSent={(tripId) => setLocalDoneBookings(prev => new Set([...prev, tripId]))}
                  theme={theme}
                />
              ))}
            </div>
          </section>
        )}

        {/* Sezione autista: valuta passeggeri */}
        {user.tipo === "autista" && offeredTrips.length > 0 && (
          <section style={s.section}>
            <div style={s.sectionHeader}>
              <div style={{ ...s.sectionIcon, background: theme.success }}>🚙</div>
              <div>
                <h3 style={s.sectionTitle}>Valuta i tuoi passeggeri</h3>
                <p style={s.sectionSub}>Viaggi che hai offerto e già effettuato</p>
              </div>
              {pendingDriver > 0 && <span style={s.sectionBadge}>{pendingDriver} da fare</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {offeredTrips.map(trip => (
                <div key={`trip-${trip.id}`} style={{ border: `1.5px solid ${theme.border}`, borderRadius: "14px", overflow: "hidden" }}>
                  <div style={{ background: theme.surfaceAlt, padding: "14px 18px", borderBottom: `1.5px solid ${theme.border}` }}>
                    <p style={{ margin: "0 0 4px", fontSize: "1.05rem", color: theme.text }}>
                      <strong>{trip.citta_partenza}</strong>
                      <span style={{ color: theme.primary, fontWeight: 700 }}> ➜ </span>
                      <strong>{trip.citta_arrivo}</strong>
                    </p>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: theme.textMuted }}>
                      📅 {trip.data_viaggio} &nbsp;·&nbsp; 🕐 {trip.ora_partenza} → {trip.ora_arrivo}
                    </p>
                  </div>
                  {trip.passengers.length === 0 ? (
                    <p style={{ padding: "16px 18px", color: theme.textLight, fontSize: "0.85rem", margin: 0 }}>
                      Nessun passeggero ha prenotato questo viaggio.
                    </p>
                  ) : (
                    <div>
                      {trip.passengers.map(p => (
                        <DriverFeedbackCard
                          key={`pax-${trip.id}-${p.passeggero_id}`}
                          trip={trip} passenger={p} userId={user.id} theme={theme}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: theme.info, border: `1.5px solid ${theme.infoBorder}`, borderRadius: "12px", padding: "14px 18px", marginTop: "4px" }}>
          <span style={{ fontSize: "1.1rem" }}>💡</span>
          <p style={{ margin: 0, fontSize: "0.85rem", color: theme.infoText }}>
            I feedback sono visibili nel profilo di ogni utente. Puoi lasciare <strong>un solo feedback per persona per viaggio</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

function makeStyles(theme) {
  return {
    wrapper:   { padding: "32px 16px", display: "flex", justifyContent: "center", minHeight: "80vh", background: theme.bg },
    container: { width: "100%", maxWidth: "720px" },
    gateCard:  { background: theme.surface, borderRadius: "20px", boxShadow: theme.shadowLg, padding: "48px 40px", textAlign: "center", maxWidth: "400px", margin: "auto" },
    gateTitle: { margin: "16px 0 8px", fontSize: "1.3rem", fontWeight: 700, color: theme.text },
    gateSub:   { color: theme.textMuted, fontSize: "0.9rem", marginBottom: "28px" },
    btnPrimary:  { width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: theme.primary, color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", marginBottom: "10px" },
    btnSecondary:{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${theme.border}`, background: theme.surface, color: theme.text, fontWeight: 600, fontSize: "0.95rem", cursor: "pointer" },
    header:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", gap: "16px" },
    title:      { margin: "0 0 6px", fontSize: "1.7rem", fontWeight: 800, color: theme.text },
    subtitle:   { margin: 0, color: theme.textMuted, fontSize: "0.9rem" },
    pendingPill:{ display: "flex", flexDirection: "column", alignItems: "center", background: theme.warning, border: `1.5px solid ${theme.warningBorder}`, borderRadius: "14px", padding: "10px 18px", flexShrink: 0 },
    pendingNum: { fontSize: "1.8rem", fontWeight: 800, color: theme.warningText, lineHeight: 1 },
    pendingLbl: { fontSize: "0.72rem", fontWeight: 600, color: theme.warningText, textTransform: "uppercase" },
    section:       { background: theme.surface, borderRadius: "18px", boxShadow: theme.shadow, padding: "24px", marginBottom: "20px" },
    sectionHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
    sectionIcon:   { width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 },
    sectionTitle:  { margin: "0 0 2px", fontSize: "1.05rem", fontWeight: 700, color: theme.text },
    sectionSub:    { margin: 0, fontSize: "0.82rem", color: theme.textMuted },
    sectionBadge:  { marginLeft: "auto", padding: "4px 12px", borderRadius: "20px", background: theme.warning, color: theme.warningText, fontSize: "0.78rem", fontWeight: 700, flexShrink: 0 },
  };
}
