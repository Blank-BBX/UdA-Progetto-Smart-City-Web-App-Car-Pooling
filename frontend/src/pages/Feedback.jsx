import { useState, useEffect, useCallback } from "react";

const TODAY = new Date().toISOString().split("T")[0];
const NOW   = new Date().toTimeString().slice(0, 5);

function isPast(t) {
  if (!t) return false;
  if (t.data_viaggio < TODAY) return true;
  if (t.data_viaggio === TODAY) return (t.ora_partenza || "23:59") < NOW;
  return false;
}

function StarPicker({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          disabled={disabled}
          style={{
            width: "36px", height: "36px",
            borderRadius: "8px", border: "none",
            background: n <= (hovered || value) ? "#fbbf24" : "#f3f4f6",
            color:      n <= (hovered || value) ? "#78350f" : "#9ca3af",
            fontSize: "1.1rem", cursor: disabled ? "default" : "pointer",
            transition: "all 0.12s", fontWeight: 700,
          }}
          onMouseEnter={() => !disabled && setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => !disabled && onChange(n)}
        >★</button>
      ))}
    </div>
  );
}

// Card per valutare l'autista di un viaggio prenotato
function PassengerFeedbackCard({ booking, userId, onSent }) {
  const [voto, setVoto]         = useState(5);
  const [commento, setCommento] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const alreadyDone = !!booking.feedback_dato;

  const send = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_autore:       userId,
          id_destinatario: booking.offerente_id,
          id_viaggio:      booking.id,
          voto,
          commento,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSent(booking.id);
      } else {
        setError(data.message || "Errore nell'invio.");
      }
    } catch {
      setError("Impossibile contattare il server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...S.fbCard, ...(alreadyDone ? S.fbCardDone : {}) }}>
      {/* Trip header */}
      <div style={S.fbCardTop}>
        <div>
          <p style={S.fbRoute}>
            <strong>{booking.citta_partenza}</strong>
            <span style={S.fbArrow}> ➜ </span>
            <strong>{booking.citta_arrivo}</strong>
          </p>
          <p style={S.fbMeta}>📅 {booking.data_viaggio} &nbsp;·&nbsp; 🕐 {booking.ora_partenza} → {booking.ora_arrivo}</p>
        </div>
        {alreadyDone
          ? <span style={S.doneBadge}>✅ Valutato</span>
          : <span style={S.pendingBadge}>⏳ In attesa</span>
        }
      </div>

      {/* Driver info */}
      <div style={S.personRow}>
        <div style={{ ...S.avatar, background: "#dbeafe", color: "#1e40af" }}>
          {booking.offerente_nome?.[0]}{booking.offerente_cognome?.[0]}
        </div>
        <div>
          <p style={S.personName}>🚙 {booking.offerente_nome} {booking.offerente_cognome}</p>
          <p style={S.personRole}>Autista del viaggio</p>
        </div>
      </div>

      {alreadyDone ? (
        <p style={S.doneText}>Hai già lasciato una recensione per questo viaggio.</p>
      ) : (
        <div style={S.formArea}>
          <div style={S.formRow}>
            <StarPicker value={voto} onChange={setVoto} disabled={false} />
            <span style={S.votoLabel}>{voto}/5</span>
          </div>
          <textarea
            style={S.textarea}
            placeholder="Commento facoltativo… (puntualità, gentilezza, auto pulita…)"
            value={commento}
            onChange={e => setCommento(e.target.value)}
            rows={2}
          />
          {error && <p style={S.errText}>{error}</p>}
          <button
            style={{ ...S.sendBtn, opacity: loading ? 0.6 : 1 }}
            onClick={send} disabled={loading}
          >
            {loading ? "Invio…" : "Invia feedback"}
          </button>
        </div>
      )}
    </div>
  );
}

// Card per valutare un passeggero (usata dall'autista)
function DriverFeedbackCard({ trip, passenger, userId, onSent }) {
  const [voto, setVoto]         = useState(5);
  const [commento, setCommento] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [localDone, setLocalDone] = useState(false);

  const alreadyDone = !!passenger.feedback_dato || localDone;

  const send = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_autore:       userId,
          id_destinatario: passenger.passeggero_id,
          id_viaggio:      trip.id,
          voto,
          commento,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalDone(true);
        onSent(trip.id, passenger.passeggero_id);
      } else {
        setError(data.message || "Errore nell'invio.");
      }
    } catch {
      setError("Impossibile contattare il server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...S.passengerItem, ...(alreadyDone ? S.passengerItemDone : {}) }}>
      <div style={S.passengerLeft}>
        <div style={{ ...S.avatar, background: "#f0fdf4", color: "#166534", fontSize: "0.95rem" }}>
          {passenger.passeggero_nome?.[0]}{passenger.passeggero_cognome?.[0]}
        </div>
        <div>
          <p style={S.personName}>👤 {passenger.passeggero_nome} {passenger.passeggero_cognome}</p>
          <p style={S.personRole}>Passeggero</p>
        </div>
      </div>

      {alreadyDone ? (
        <span style={S.doneBadge}>✅ Valutato</span>
      ) : (
        <div style={S.inlineForm}>
          <StarPicker value={voto} onChange={setVoto} disabled={false} />
          <input
            style={S.inlineInput}
            placeholder="Commento (opzionale)"
            value={commento}
            onChange={e => setCommento(e.target.value)}
          />
          {error && <p style={{ ...S.errText, marginBottom: 0 }}>{error}</p>}
          <button
            style={{ ...S.sendBtnSm, opacity: loading ? 0.6 : 1 }}
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
  const [bookings,     setBookings]     = useState([]);
  const [offeredTrips, setOfferedTrips] = useState([]);
  const [loading,      setLoading]      = useState(true);
  // local overrides per le cards già inviate in questa sessione
  const [localDoneBookings, setLocalDoneBookings] = useState(new Set());

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [bRes, oRes] = await Promise.all([
        fetch(`http://localhost:5000/api/bookings?id_passeggero=${user.id}`).then(r => r.json()),
        user.tipo === "autista"
          ? fetch(`http://localhost:5000/api/trips/offered?id_autista=${user.id}`).then(r => r.json())
          : { success: true, trips: [] },
      ]);
      setBookings(bRes.bookings ?? []);
      setOfferedTrips(oRes.trips   ?? []);
    } catch {
      setBookings([]);
      setOfferedTrips([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (!user) {
    return (
      <div style={S.wrapper}>
        <div style={S.gateCard}>
          <span style={{ fontSize: "2.8rem" }}>⭐</span>
          <h3 style={S.gateTitle}>Accedi per lasciare un feedback</h3>
          <p style={S.gateSub}>Le recensioni aiutano la community a viaggiare in sicurezza.</p>
          <button style={S.btnPrimary} onClick={() => setPage("login")}>Vai al Login</button>
          <button style={S.btnSecondary} onClick={() => setPage("register")}>Registrati</button>
        </div>
      </div>
    );
  }

  // Filtra prenotazioni: solo viaggi già effettuati
  const pastBookings = bookings.filter(b => isPast(b));

  // Conteggio pendenti (per badge)
  const pendingPassenger = pastBookings.filter(b => !b.feedback_dato && !localDoneBookings.has(b.id)).length;
  const pendingDriver    = offeredTrips.reduce((acc, t) =>
    acc + (t.passengers || []).filter(p => !p.feedback_dato).length, 0);

  if (loading) {
    return (
      <div style={S.wrapper}>
        <div style={S.loadingBox}>
          <div style={S.spinner} />
          <p style={{ color: "#6b7280", marginTop: "12px" }}>Caricamento viaggi…</p>
        </div>
      </div>
    );
  }

  const hasAnything = pastBookings.length > 0 || offeredTrips.some(t => t.passengers?.length > 0);

  return (
    <div style={S.wrapper}>
      <div style={S.container}>

        {/* ── Intestazione ── */}
        <div style={S.header}>
          <div>
            <h2 style={S.title}>⭐ Lascia un Feedback</h2>
            <p style={S.subtitle}>
              Valuta chi ha condiviso il viaggio con te — le recensioni rendono la piattaforma più sicura per tutti.
            </p>
          </div>
          {(pendingPassenger + pendingDriver) > 0 && (
            <div style={S.pendingPill}>
              <span style={S.pendingNum}>{pendingPassenger + pendingDriver}</span>
              <span style={S.pendingLbl}>in attesa</span>
            </div>
          )}
        </div>

        {!hasAnything && (
          <div style={S.emptyState}>
            <p style={{ fontSize: "3rem", margin: "0 0 12px" }}>🚗</p>
            <h3 style={{ margin: "0 0 8px", color: "#374151" }}>Nessun viaggio da valutare</h3>
            <p style={{ color: "#6b7280", margin: "0 0 24px", fontSize: "0.9rem" }}>
              I feedback si sbloccano dopo aver effettuato un viaggio.
            </p>
            <button style={S.btnPrimary} onClick={() => setPage("search")}>Cerca un viaggio</button>
          </div>
        )}

        {/* ── SEZIONE PASSEGGERO: valuta gli autisti ── */}
        {pastBookings.length > 0 && (
          <section style={S.section}>
            <div style={S.sectionHeader}>
              <div style={{ ...S.sectionIcon, background: "#dbeafe" }}>🧑‍💼</div>
              <div>
                <h3 style={S.sectionTitle}>Valuta gli autisti</h3>
                <p style={S.sectionSub}>Viaggi che hai prenotato e già effettuato</p>
              </div>
              {pendingPassenger > 0 && (
                <span style={S.sectionBadge}>{pendingPassenger} da fare</span>
              )}
            </div>

            <div style={S.cardList}>
              {pastBookings.map(b => (
                <PassengerFeedbackCard
                  key={`booking-${b.prenotazione_id}`}
                  booking={{ ...b, feedback_dato: b.feedback_dato || localDoneBookings.has(b.id) || undefined }}
                  userId={user.id}
                  onSent={(tripId) => setLocalDoneBookings(prev => new Set([...prev, tripId]))}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── SEZIONE AUTISTA: valuta i passeggeri ── */}
        {user.tipo === "autista" && offeredTrips.length > 0 && (
          <section style={S.section}>
            <div style={S.sectionHeader}>
              <div style={{ ...S.sectionIcon, background: "#f0fdf4" }}>🚙</div>
              <div>
                <h3 style={S.sectionTitle}>Valuta i tuoi passeggeri</h3>
                <p style={S.sectionSub}>Viaggi che hai offerto e già effettuato</p>
              </div>
              {pendingDriver > 0 && (
                <span style={S.sectionBadge}>{pendingDriver} da fare</span>
              )}
            </div>

            <div style={S.cardList}>
              {offeredTrips.map(trip => (
                <div key={`trip-${trip.id}`} style={S.tripBlock}>
                  <div style={S.tripBlockHeader}>
                    <p style={S.fbRoute}>
                      <strong>{trip.citta_partenza}</strong>
                      <span style={S.fbArrow}> ➜ </span>
                      <strong>{trip.citta_arrivo}</strong>
                    </p>
                    <p style={S.fbMeta}>📅 {trip.data_viaggio} &nbsp;·&nbsp; 🕐 {trip.ora_partenza} → {trip.ora_arrivo}</p>
                  </div>

                  {trip.passengers.length === 0 ? (
                    <p style={S.noPassengers}>Nessun passeggero ha prenotato questo viaggio.</p>
                  ) : (
                    <div style={S.passengerList}>
                      {trip.passengers.map(p => (
                        <DriverFeedbackCard
                          key={`pax-${trip.id}-${p.passeggero_id}`}
                          trip={trip}
                          passenger={p}
                          userId={user.id}
                          onSent={() => {}}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Info box */}
        <div style={S.infoBox}>
          <span style={{ fontSize: "1.1rem" }}>💡</span>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#1e40af" }}>
            I feedback sono visibili nel profilo di ogni utente e contribuiscono a costruire la reputazione nella community.
            Puoi lasciare <strong>un solo feedback per persona per viaggio</strong>.
          </p>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const S = {
  wrapper:   { padding: "32px 16px", display: "flex", justifyContent: "center", minHeight: "80vh" },
  container: { width: "100%", maxWidth: "720px" },

  // Loading
  loadingBox: { minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  spinner:    { width: "36px", height: "36px", border: "3px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  // Gate (non loggato)
  gateCard:    { background: "#fff", borderRadius: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.1)", padding: "48px 40px", textAlign: "center", maxWidth: "400px", margin: "auto" },
  gateTitle:   { margin: "16px 0 8px", fontSize: "1.3rem", fontWeight: 700, color: "#1a1a2e" },
  gateSub:     { color: "#6b7280", fontSize: "0.9rem", marginBottom: "28px" },
  btnPrimary:  { width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", marginBottom: "10px" },
  btnSecondary:{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #d1d5db", background: "#fff", color: "#374151", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer" },

  // Header
  header:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", gap: "16px" },
  title:      { margin: "0 0 6px", fontSize: "1.7rem", fontWeight: 800, color: "#1a1a2e" },
  subtitle:   { margin: 0, color: "#6b7280", fontSize: "0.9rem", maxWidth: "480px" },
  pendingPill:{ display: "flex", flexDirection: "column", alignItems: "center", background: "#fef3c7", border: "1.5px solid #fcd34d", borderRadius: "14px", padding: "10px 18px", flexShrink: 0 },
  pendingNum: { fontSize: "1.8rem", fontWeight: 800, color: "#92400e", lineHeight: 1 },
  pendingLbl: { fontSize: "0.72rem", fontWeight: 600, color: "#92400e", textTransform: "uppercase" },

  // Empty
  emptyState: { textAlign: "center", padding: "64px 0" },

  // Section
  section:       { background: "#fff", borderRadius: "18px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", padding: "24px", marginBottom: "20px" },
  sectionHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
  sectionIcon:   { width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 },
  sectionTitle:  { margin: "0 0 2px", fontSize: "1.05rem", fontWeight: 700, color: "#1a1a2e" },
  sectionSub:    { margin: 0, fontSize: "0.82rem", color: "#6b7280" },
  sectionBadge:  { marginLeft: "auto", padding: "4px 12px", borderRadius: "20px", background: "#fef3c7", color: "#92400e", fontSize: "0.78rem", fontWeight: 700, flexShrink: 0 },
  cardList:      { display: "flex", flexDirection: "column", gap: "14px" },

  // Feedback card (passenger side)
  fbCard:     { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: "14px", padding: "18px 20px", transition: "border-color 0.2s" },
  fbCardDone: { background: "#f0fdf4", border: "1.5px solid #bbf7d0" },
  fbCardTop:  { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", gap: "8px" },
  fbRoute:    { margin: "0 0 4px", fontSize: "1.05rem", color: "#1a1a2e" },
  fbArrow:    { color: "#2563eb", fontWeight: 700 },
  fbMeta:     { margin: 0, fontSize: "0.82rem", color: "#6b7280" },

  doneBadge:    { padding: "4px 12px", borderRadius: "20px", background: "#dcfce7", color: "#166534", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 },
  pendingBadge: { padding: "4px 12px", borderRadius: "20px", background: "#fef3c7", color: "#92400e", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 },

  personRow:  { display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" },
  avatar:     { width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700, flexShrink: 0, textTransform: "uppercase" },
  personName: { margin: "0 0 2px", fontWeight: 700, fontSize: "0.92rem", color: "#1a1a2e" },
  personRole: { margin: 0, fontSize: "0.78rem", color: "#6b7280" },

  doneText:   { margin: 0, color: "#166534", fontSize: "0.85rem", fontStyle: "italic" },

  formArea:   { display: "flex", flexDirection: "column", gap: "10px" },
  formRow:    { display: "flex", alignItems: "center", gap: "12px" },
  votoLabel:  { fontWeight: 700, color: "#92400e", fontSize: "0.9rem" },
  textarea:   { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #d1d5db", fontSize: "0.88rem", resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
  errText:    { margin: "0 0 6px", color: "#b91c1c", fontSize: "0.82rem" },
  sendBtn:    { alignSelf: "flex-start", padding: "9px 22px", borderRadius: "9px", border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" },

  // Trip block (driver side)
  tripBlock:       { border: "1.5px solid #e5e7eb", borderRadius: "14px", overflow: "hidden" },
  tripBlockHeader: { background: "linear-gradient(135deg,#eff6ff,#f0fdf4)", padding: "14px 18px", borderBottom: "1.5px solid #e5e7eb" },
  noPassengers:    { padding: "16px 18px", color: "#9ca3af", fontSize: "0.85rem", margin: 0 },
  passengerList:   { display: "flex", flexDirection: "column" },

  passengerItem:     { display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", borderBottom: "1px solid #f3f4f6", flexWrap: "wrap", transition: "background 0.15s" },
  passengerItemDone: { background: "#f0fdf4" },
  passengerLeft:     { display: "flex", alignItems: "center", gap: "10px", minWidth: "180px" },

  inlineForm:  { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", flex: 1 },
  inlineInput: { flex: 1, minWidth: "140px", padding: "7px 10px", borderRadius: "7px", border: "1.5px solid #d1d5db", fontSize: "0.85rem", outline: "none" },
  sendBtnSm:   { padding: "7px 16px", borderRadius: "7px", border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", whiteSpace: "nowrap" },

  // Info box
  infoBox: { display: "flex", alignItems: "flex-start", gap: "10px", background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: "12px", padding: "14px 18px", marginTop: "4px" },
};
