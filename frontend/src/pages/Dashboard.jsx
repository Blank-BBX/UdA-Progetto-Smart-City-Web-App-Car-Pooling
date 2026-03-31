import { useState, useEffect } from "react";

const TODAY = new Date().toISOString().split("T")[0];

function isPast(trip) {
  if (trip.data_viaggio < TODAY) return true;
  if (trip.data_viaggio === TODAY) {
    const now = new Date().toTimeString().slice(0, 5);
    return (trip.ora_partenza || "23:59") < now;
  }
  return false;
}

function StarRating({ value, count }) {
  if (!value) return null;
  return (
    <span style={styles.stars} title={`${value}/5 (${count} recensioni)`}>
      {"★".repeat(Math.round(value))}{"☆".repeat(5 - Math.round(value))}
      <span style={styles.starsVal}> {Number(value).toFixed(1)}</span>
    </span>
  );
}

export default function Dashboard({ user, setPage }) {
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [tab, setTab] = useState("available"); // "available" | "booked"

  useEffect(() => {
    setLoadingTrips(true);
    fetch("http://localhost:5000/api/trips")
      .then(res => res.json())
      .then(data => setTrips(data.trips ?? []))
      .catch(() => {})
      .finally(() => setLoadingTrips(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoadingBookings(true);
    fetch(`http://localhost:5000/api/bookings?id_passeggero=${user.id}`)
      .then(res => res.json())
      .then(data => setBookings(data.bookings ?? []))
      .catch(() => {})
      .finally(() => setLoadingBookings(false));
  }, [user]);

  const futureTrips = trips.filter(t => !isPast(t));
  const pastTrips   = trips.filter(t => isPast(t));

  return (
    <div style={styles.wrapper}>
      {/* Hero */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>🚗 SmartCity Car Pooling</h1>
        <p style={styles.heroSub}>Mobilità sostenibile e intelligente per la tua città</p>
        <div style={styles.heroBtns}>
          <button style={styles.btnPrimary} onClick={() => setPage("search")}>
            🔍 Cerca un viaggio
          </button>
          {user?.tipo === "autista" && (
            <button style={styles.btnSecondary} onClick={() => setPage("create")}>
              ➕ Offri un passaggio
            </button>
          )}
          {user?.tipo === "passeggero" && (
            <button style={styles.btnSecondary} onClick={() => setPage("profile")}>
              🚙 Aggiungi veicolo per guidare
            </button>
          )}
          {!user && (
            <button style={styles.btnSecondary} onClick={() => setPage("register")}>
              Registrati gratis
            </button>
          )}
        </div>
        {user && (
          <div style={{
            ...styles.badge,
            background: user.tipo === "autista" ? "#dcfce7" : "#dbeafe",
            color: user.tipo === "autista" ? "#166534" : "#1e40af",
          }}>
            {user.tipo === "autista" ? "🚙 Autista" : "👤 Passeggero"}
          </div>
        )}
      </div>

      {/* Tab selector — mostrate solo se loggato */}
      {user && (
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === "available" ? styles.tabActive : {}) }}
            onClick={() => setTab("available")}
          >
            Viaggi disponibili
          </button>
          <button
            style={{ ...styles.tab, ...(tab === "booked" ? styles.tabActive : {}) }}
            onClick={() => setTab("booked")}
          >
            I miei viaggi prenotati
            {bookings.length > 0 && (
              <span style={styles.tabBadge}>{bookings.length}</span>
            )}
          </button>
        </div>
      )}

      {/* ─── TAB: VIAGGI DISPONIBILI ─── */}
      {tab === "available" && (
        <div style={styles.section}>
          {loadingTrips && <p style={styles.empty}>Caricamento…</p>}
          {!loadingTrips && futureTrips.length === 0 && pastTrips.length === 0 && (
            <p style={styles.empty}>Nessun viaggio disponibile al momento.</p>
          )}

          {/* Prossimi */}
          {futureTrips.length > 0 && (
            <>
              <h3 style={styles.groupLabel}>Prossimi viaggi</h3>
              <div style={styles.list}>
                {futureTrips.map(trip => (
                  <TripCard key={trip.id} trip={trip} past={false} user={user} setPage={setPage} />
                ))}
              </div>
            </>
          )}

          {/* Passati */}
          {pastTrips.length > 0 && (
            <>
              <h3 style={{ ...styles.groupLabel, color: "#9ca3af", marginTop: "32px" }}>
                Viaggi già effettuati
              </h3>
              <div style={styles.list}>
                {pastTrips.map(trip => (
                  <TripCard key={trip.id} trip={trip} past={true} user={user} setPage={setPage} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB: MIEI PRENOTATI ─── */}
      {tab === "booked" && (
        <div style={styles.section}>
          {loadingBookings && <p style={styles.empty}>Caricamento…</p>}
          {!loadingBookings && bookings.length === 0 && (
            <div style={styles.emptyState}>
              <p style={{ fontSize: "2rem", margin: "0 0 8px" }}>🎫</p>
              <p style={{ color: "#666" }}>Non hai ancora prenotato nessun viaggio.</p>
              <button style={styles.ctaBtn} onClick={() => setPage("search")}>
                Cerca un viaggio →
              </button>
            </div>
          )}
          {bookings.length > 0 && (
            <>
              {/* Futuri */}
              {bookings.filter(b => !isPast(b)).length > 0 && (
                <>
                  <h3 style={styles.groupLabel}>In programma</h3>
                  <div style={styles.list}>
                    {bookings.filter(b => !isPast(b)).map(b => (
                      <BookingCard key={b.prenotazione_id} booking={b} past={false} setPage={setPage} />
                    ))}
                  </div>
                </>
              )}
              {/* Passati */}
              {bookings.filter(b => isPast(b)).length > 0 && (
                <>
                  <h3 style={{ ...styles.groupLabel, color: "#9ca3af", marginTop: "32px" }}>
                    Viaggi già effettuati
                  </h3>
                  <div style={styles.list}>
                    {bookings.filter(b => isPast(b)).map(b => (
                      <BookingCard key={b.prenotazione_id} booking={b} past={true} setPage={setPage} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TripCard({ trip, past, user, setPage }) {
  return (
    <div style={{ ...styles.card, ...(past ? styles.cardPast : {}) }}>
      <div style={styles.cardTop}>
        <span style={{ ...styles.route, opacity: past ? 0.6 : 1 }}>
          <strong>{trip.citta_partenza}</strong>
          <span style={styles.arrow}> ➜ </span>
          <strong>{trip.citta_arrivo}</strong>
        </span>
        {past ? (
          <span style={styles.pastTag}>Già effettuato</span>
        ) : (
          <span style={{
            ...styles.seatsBadge,
            background: trip.posti_liberi > 0 ? "#dcfce7" : "#fee2e2",
            color: trip.posti_liberi > 0 ? "#166534" : "#991b1b",
          }}>
            💺 {trip.posti_liberi ?? trip.posti} liberi
          </span>
        )}
      </div>
      <p style={styles.cardInfo}>📅 {trip.data_viaggio} &nbsp;|&nbsp; 🕐 {trip.ora_partenza} → {trip.ora_arrivo}</p>
      <div style={styles.driverRow}>
        <span style={styles.cardInfo}>🧑 {trip.offerente_nome} {trip.offerente_cognome}</span>
        {trip.voto_medio_autista > 0 && (
          <StarRating value={trip.voto_medio_autista} count={trip.num_feedback} />
        )}
      </div>
      {trip.descrizione && <p style={styles.cardDesc}>📝 {trip.descrizione}</p>}
      {!past && (
        <button style={styles.linkBtn} onClick={() => setPage("search")}>
          Vedi tutti i viaggi →
        </button>
      )}
    </div>
  );
}

function BookingCard({ booking, past, setPage }) {
  const statoColors = {
    in_attesa:  { bg: "#fefce8", color: "#92400e", label: "⏳ In attesa" },
    accettata:  { bg: "#f0fdf4", color: "#166534", label: "✅ Accettata" },
    rifiutata:  { bg: "#fff1f2", color: "#9f1239", label: "❌ Rifiutata" },
  };
  const stato = statoColors[booking.stato] ?? statoColors.in_attesa;

  return (
    <div style={{ ...styles.card, ...(past ? styles.cardPast : {}), borderLeft: `4px solid ${past ? "#d1d5db" : "#2563eb"}` }}>
      <div style={styles.cardTop}>
        <span style={{ ...styles.route, opacity: past ? 0.6 : 1 }}>
          <strong>{booking.citta_partenza}</strong>
          <span style={styles.arrow}> ➜ </span>
          <strong>{booking.citta_arrivo}</strong>
        </span>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
          {past && <span style={styles.pastTag}>Già effettuato</span>}
          <span style={{ ...styles.statoBadge, background: stato.bg, color: stato.color }}>
            {stato.label}
          </span>
        </div>
      </div>
      <p style={styles.cardInfo}>📅 {booking.data_viaggio} &nbsp;|&nbsp; 🕐 {booking.ora_partenza} → {booking.ora_arrivo}</p>
      <div style={styles.driverRow}>
        <span style={styles.cardInfo}>🧑 {booking.offerente_nome} {booking.offerente_cognome}</span>
        {booking.voto_medio_autista > 0 && (
          <StarRating value={booking.voto_medio_autista} count={null} />
        )}
      </div>
      {past && (
        <button style={styles.linkBtn} onClick={() => setPage("feedback")}>
          ⭐ Lascia un feedback
        </button>
      )}
    </div>
  );
}

const styles = {
  wrapper: { maxWidth: "900px", margin: "0 auto", padding: "24px 16px" },
  hero: {
    background: "linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)",
    borderRadius: "20px", padding: "48px 40px", color: "#fff",
    marginBottom: "28px", textAlign: "center",
  },
  heroTitle: { margin: "0 0 8px", fontSize: "2rem", fontWeight: 800 },
  heroSub: { margin: "0 0 28px", opacity: 0.85, fontSize: "1.05rem" },
  heroBtns: { display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" },
  btnPrimary: { padding: "12px 28px", borderRadius: "10px", border: "none", background: "#fff", color: "#2563eb", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" },
  btnSecondary: { padding: "12px 28px", borderRadius: "10px", border: "2px solid rgba(255,255,255,0.7)", background: "transparent", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" },
  badge: { display: "inline-block", marginTop: "20px", padding: "6px 16px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600 },

  tabs: { display: "flex", gap: "4px", marginBottom: "20px", background: "#f3f4f6", padding: "4px", borderRadius: "12px" },
  tab: { flex: 1, padding: "10px 16px", borderRadius: "9px", border: "none", background: "transparent", color: "#6b7280", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  tabActive: { background: "#fff", color: "#1a1a2e", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
  tabBadge: { background: "#2563eb", color: "#fff", borderRadius: "10px", padding: "1px 8px", fontSize: "0.75rem", fontWeight: 700 },

  section: { minHeight: "100px" },
  groupLabel: { fontSize: "1rem", fontWeight: 700, color: "#374151", margin: "0 0 12px" },
  empty: { color: "#888", textAlign: "center", padding: "40px 0" },
  emptyState: { textAlign: "center", padding: "48px 0" },
  ctaBtn: { marginTop: "12px", padding: "10px 24px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" },
  list: { display: "flex", flexDirection: "column", gap: "12px" },

  card: { background: "#fff", borderRadius: "14px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", padding: "18px 22px", position: "relative" },
  cardPast: { background: "#f9fafb", boxShadow: "none", border: "1px solid #e5e7eb" },
  pastTag: { fontSize: "0.72rem", background: "#e5e7eb", color: "#6b7280", padding: "2px 10px", borderRadius: "10px", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" },
  route: { fontSize: "1.08rem" },
  arrow: { color: "#2563eb", fontWeight: 700 },
  seatsBadge: { padding: "3px 10px", borderRadius: "10px", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" },
  statoBadge: { padding: "3px 10px", borderRadius: "10px", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" },
  cardInfo: { margin: "3px 0", color: "#555", fontSize: "0.88rem" },
  cardDesc: { margin: "8px 0 0", color: "#777", fontSize: "0.85rem", fontStyle: "italic" },
  driverRow: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  stars: { color: "#f59e0b", fontSize: "0.85rem", letterSpacing: "1px" },
  starsVal: { color: "#92400e", fontWeight: 700, fontSize: "0.82rem" },
  linkBtn: { marginTop: "12px", padding: "7px 16px", borderRadius: "8px", border: "none", background: "#eff6ff", color: "#2563eb", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" },
};
