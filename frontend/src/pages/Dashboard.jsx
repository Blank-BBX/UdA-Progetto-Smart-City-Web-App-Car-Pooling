import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

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
    <span style={{ color: "#f59e0b", fontSize: "0.85rem", letterSpacing: "1px" }} title={`${value}/5 (${count} recensioni)`}>
      {"★".repeat(Math.round(value))}{"☆".repeat(5 - Math.round(value))}
      <span style={{ color: "#92400e", fontWeight: 700, fontSize: "0.82rem" }}> {Number(value).toFixed(1)}</span>
    </span>
  );
}

export default function Dashboard({ user, setPage }) {
  const { theme } = useTheme();
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [tab, setTab] = useState("available");

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

  const s = makeStyles(theme);

  return (
    <div style={s.wrapper}>
      {/* Hero */}
      <div style={s.hero}>
        <h1 style={s.heroTitle}>🚗 SmartCity Car Pooling</h1>
        <p style={s.heroSub}>Mobilità sostenibile e intelligente per la tua città</p>
        <div style={s.heroBtns}>
          <button style={s.btnPrimary} onClick={() => setPage("search")}>🔍 Cerca un viaggio</button>
          {user?.tipo === "autista" && (
            <button style={s.btnSecondary} onClick={() => setPage("create")}>➕ Offri un passaggio</button>
          )}
          {user?.tipo === "passeggero" && (
            <button style={s.btnSecondary} onClick={() => setPage("profile")}>🚙 Aggiungi veicolo per guidare</button>
          )}
          {!user && (
            <button style={s.btnSecondary} onClick={() => setPage("register")}>Registrati gratis</button>
          )}
        </div>
        {user && (
          <div style={{
            ...s.badge,
            background: user.tipo === "autista" ? theme.driverBadgeBg : theme.passengerBadgeBg,
            color: user.tipo === "autista" ? theme.driverBadgeColor : theme.passengerBadgeColor,
          }}>
            {user.tipo === "autista" ? "🚙 Autista" : "👤 Passeggero"}
          </div>
        )}
      </div>

      {/* Tabs — solo se loggato */}
      {user && (
        <div style={s.tabs}>
          {[
            ["available", "Viaggi disponibili", null],
            ["booked", "I miei viaggi prenotati", bookings.length > 0 ? bookings.length : null],
          ].map(([key, label, badge]) => (
            <button
              key={key}
              style={{ ...s.tab, ...(tab === key ? s.tabActive : {}) }}
              onClick={() => setTab(key)}
            >
              {label}
              {badge && <span style={s.tabBadge}>{badge}</span>}
            </button>
          ))}
        </div>
      )}

      {/* ─── TAB: VIAGGI DISPONIBILI ─── */}
      {tab === "available" && (
        <div style={s.section}>
          {loadingTrips && <p style={s.empty}>Caricamento…</p>}
          {!loadingTrips && futureTrips.length === 0 && pastTrips.length === 0 && (
            <p style={s.empty}>Nessun viaggio disponibile al momento.</p>
          )}

          {futureTrips.length > 0 && (
            <>
              <h3 style={s.groupLabel}>Prossimi viaggi</h3>
              <div style={s.list}>
                {futureTrips.map(trip => (
                  <TripCard key={trip.id} trip={trip} past={false} user={user} setPage={setPage} theme={theme} />
                ))}
              </div>
            </>
          )}

          {pastTrips.length > 0 && (
            <>
              <h3 style={{ ...s.groupLabel, color: theme.textLight, marginTop: "32px" }}>Viaggi già effettuati</h3>
              <div style={s.list}>
                {pastTrips.map(trip => (
                  <TripCard key={trip.id} trip={trip} past={true} user={user} setPage={setPage} theme={theme} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB: MIEI PRENOTATI ─── */}
      {tab === "booked" && (
        <div style={s.section}>
          {loadingBookings && <p style={s.empty}>Caricamento…</p>}
          {!loadingBookings && bookings.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <p style={{ fontSize: "2rem", margin: "0 0 8px" }}>🎫</p>
              <p style={{ color: theme.textMuted }}>Non hai ancora prenotato nessun viaggio.</p>
              <button style={s.ctaBtn} onClick={() => setPage("search")}>Cerca un viaggio →</button>
            </div>
          )}
          {bookings.length > 0 && (
            <>
              {bookings.filter(b => !isPast(b)).length > 0 && (
                <>
                  <h3 style={s.groupLabel}>In programma</h3>
                  <div style={s.list}>
                    {bookings.filter(b => !isPast(b)).map(b => (
                      <BookingCard key={b.prenotazione_id} booking={b} past={false} setPage={setPage} theme={theme} />
                    ))}
                  </div>
                </>
              )}
              {bookings.filter(b => isPast(b)).length > 0 && (
                <>
                  <h3 style={{ ...s.groupLabel, color: theme.textLight, marginTop: "32px" }}>Viaggi già effettuati</h3>
                  <div style={s.list}>
                    {bookings.filter(b => isPast(b)).map(b => (
                      <BookingCard key={b.prenotazione_id} booking={b} past={true} setPage={setPage} theme={theme} />
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

function TripCard({ trip, past, user, setPage, theme }) {
  const s = makeStyles(theme);
  return (
    <div style={{ ...s.card, ...(past ? s.cardPast : {}) }}>
      <div style={s.cardTop}>
        <span style={{ ...s.route, opacity: past ? 0.6 : 1 }}>
          <strong>{trip.citta_partenza}</strong>
          <span style={{ color: past ? theme.textLight : theme.primary, fontWeight: 700 }}> ➜ </span>
          <strong>{trip.citta_arrivo}</strong>
        </span>
        {past ? (
          <span style={s.pastTag}>Già effettuato</span>
        ) : (
          <span style={{
            ...s.seatsBadge,
            background: trip.posti_liberi > 0 ? theme.success : theme.error,
            color: trip.posti_liberi > 0 ? theme.successText : theme.errorText,
          }}>
            💺 {trip.posti_liberi ?? trip.posti} liberi
          </span>
        )}
      </div>
      <p style={s.cardInfo}>📅 {trip.data_viaggio} &nbsp;|&nbsp; 🕐 {trip.ora_partenza} → {trip.ora_arrivo}</p>
      <div style={s.driverRow}>
        <span style={s.cardInfo}>🧑 {trip.offerente_nome} {trip.offerente_cognome}</span>
        {trip.voto_medio_autista > 0 && <StarRating value={trip.voto_medio_autista} count={trip.num_feedback} />}
      </div>
      {trip.descrizione && <p style={s.cardDesc}>📝 {trip.descrizione}</p>}
      {!past && (
        <button style={s.linkBtn} onClick={() => setPage("search")}>Vedi tutti i viaggi →</button>
      )}
    </div>
  );
}

function BookingCard({ booking, past, setPage, theme }) {
  const s = makeStyles(theme);
  const statoMap = {
    in_attesa: { bg: theme.warning, color: theme.warningText, label: "⏳ In attesa" },
    accettata: { bg: theme.success, color: theme.successText, label: "✅ Accettata" },
    rifiutata: { bg: theme.error,   color: theme.errorText,   label: "❌ Rifiutata" },
  };
  const stato = statoMap[booking.stato] ?? statoMap.in_attesa;

  return (
    <div style={{ ...s.card, ...(past ? s.cardPast : {}), borderLeft: `4px solid ${past ? theme.border : theme.primary}` }}>
      <div style={s.cardTop}>
        <span style={{ ...s.route, opacity: past ? 0.6 : 1 }}>
          <strong>{booking.citta_partenza}</strong>
          <span style={{ color: past ? theme.textLight : theme.primary, fontWeight: 700 }}> ➜ </span>
          <strong>{booking.citta_arrivo}</strong>
        </span>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
          {past && <span style={s.pastTag}>Già effettuato</span>}
          <span style={{ ...s.seatsBadge, background: stato.bg, color: stato.color }}>{stato.label}</span>
        </div>
      </div>
      <p style={s.cardInfo}>📅 {booking.data_viaggio} &nbsp;|&nbsp; 🕐 {booking.ora_partenza} → {booking.ora_arrivo}</p>
      <div style={s.driverRow}>
        <span style={s.cardInfo}>🧑 {booking.offerente_nome} {booking.offerente_cognome}</span>
        {booking.voto_medio_autista > 0 && <StarRating value={booking.voto_medio_autista} count={null} />}
      </div>
      {past && (
        <button style={s.linkBtn} onClick={() => setPage("feedback")}>⭐ Lascia un feedback</button>
      )}
    </div>
  );
}

function makeStyles(theme) {
  return {
    wrapper: { maxWidth: "900px", margin: "0 auto", padding: "24px 16px" },
    hero: {
      background: theme.heroBg,
      borderRadius: "20px", padding: "48px 40px", color: "#fff",
      marginBottom: "28px", textAlign: "center",
    },
    heroTitle: { margin: "0 0 8px", fontSize: "2rem", fontWeight: 800 },
    heroSub: { margin: "0 0 28px", opacity: 0.85, fontSize: "1.05rem" },
    heroBtns: { display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" },
    btnPrimary: { padding: "12px 28px", borderRadius: "10px", border: "none", background: "#fff", color: theme.primary, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" },
    btnSecondary: { padding: "12px 28px", borderRadius: "10px", border: "2px solid rgba(255,255,255,0.7)", background: "transparent", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" },
    badge: { display: "inline-block", marginTop: "20px", padding: "6px 16px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600 },
    tabs: { display: "flex", gap: "4px", marginBottom: "20px", background: theme.tabBg, padding: "4px", borderRadius: "12px" },
    tab: { flex: 1, padding: "10px 16px", borderRadius: "9px", border: "none", background: "transparent", color: theme.textMuted, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
    tabActive: { background: theme.tabActive, color: theme.text, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
    tabBadge: { background: theme.primary, color: "#fff", borderRadius: "10px", padding: "1px 8px", fontSize: "0.75rem", fontWeight: 700 },
    section: { minHeight: "100px" },
    groupLabel: { fontSize: "1rem", fontWeight: 700, color: theme.text, margin: "0 0 12px" },
    empty: { color: theme.textMuted, textAlign: "center", padding: "40px 0" },
    ctaBtn: { marginTop: "12px", padding: "10px 24px", borderRadius: "8px", border: "none", background: theme.primary, color: "#fff", fontWeight: 700, cursor: "pointer" },
    list: { display: "flex", flexDirection: "column", gap: "12px" },
    card: { background: theme.surface, borderRadius: "14px", boxShadow: theme.shadow, padding: "18px 22px", position: "relative" },
    cardPast: { background: theme.cardPastBg, boxShadow: "none", border: `1px solid ${theme.border}` },
    pastTag: { fontSize: "0.72rem", background: theme.surfaceAlt, color: theme.textMuted, padding: "2px 10px", borderRadius: "10px", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 },
    cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" },
    route: { fontSize: "1.08rem", color: theme.text },
    seatsBadge: { padding: "3px 10px", borderRadius: "10px", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" },
    cardInfo: { margin: "3px 0", color: theme.textMuted, fontSize: "0.88rem" },
    cardDesc: { margin: "8px 0 0", color: theme.textLight, fontSize: "0.85rem", fontStyle: "italic" },
    driverRow: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
    linkBtn: { marginTop: "12px", padding: "7px 16px", borderRadius: "8px", border: "none", background: theme.info, color: theme.infoText, fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" },
  };
}
