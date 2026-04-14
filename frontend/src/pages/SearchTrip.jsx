import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { co2Saved, estimateKm, FUEL_TYPES } from "../utils/co2";

const TODAY = new Date().toISOString().split("T")[0];

function isPastTrip(trip) {
  if (trip.data_viaggio < TODAY) return true;
  if (trip.data_viaggio === TODAY) {
    const now = new Date().toTimeString().slice(0, 5);
    return (trip.ora_partenza || "23:59") < now;
  }
  return false;
}

function StarRating({ value, count }) {
  if (!value) return null;
  const rounded = Math.round(value);
  return (
    <span style={{ color: "#f59e0b", fontSize: "0.82rem", letterSpacing: "1px" }}>
      {"★".repeat(rounded)}{"☆".repeat(5 - rounded)}
      <span style={{ color: "#92400e", fontWeight: 700, marginLeft: "4px" }}>{Number(value).toFixed(1)}</span>
      {count > 0 && <span style={{ color: "#9ca3af", fontWeight: 400 }}> ({count})</span>}
    </span>
  );
}

function Co2Celebration({ km, fuelType, onDone }) {
  const kg = co2Saved(km, fuelType);
  const fuel = FUEL_TYPES[fuelType] || FUEL_TYPES.benzina;
  useEffect(() => {
    const t = setTimeout(onDone, 3400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={cel.overlay}>
      <div style={cel.box}>
        <div style={cel.leaf}>🌿</div>
        <p style={cel.title}>Prenotazione effettuata!</p>
        <p style={cel.sub}>Con un'auto {fuel.label.split(" ")[0].toLowerCase()} hai risparmiato circa</p>
        <p style={cel.kg}>{kg} kg</p>
        <p style={cel.label}>di CO₂ rispetto a guidare da solo</p>
        {parseFloat(kg) > 0 ? (
          <p style={cel.eq}>≈ {Math.round(parseFloat(kg) * 4)} km in auto solo tua 🚗💨</p>
        ) : (
          <p style={cel.eq}>Auto elettrica: zero emissioni dirette! ⚡✨</p>
        )}
        <div style={cel.fuelTag}>{fuel.icon} {fuel.label}</div>
      </div>
    </div>
  );
}

const cel = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  box: { background: "#fff", borderRadius: "20px", padding: "40px 36px", textAlign: "center", maxWidth: "340px", width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" },
  leaf: { fontSize: "3.5rem", marginBottom: "8px" },
  title: { margin: "0 0 8px", fontSize: "1.3rem", fontWeight: 800, color: "#166534" },
  sub: { margin: "0 0 4px", fontSize: "0.88rem", color: "#555" },
  kg: { margin: "8px 0 2px", fontSize: "3rem", fontWeight: 900, color: "#16a34a" },
  label: { margin: "0 0 12px", fontSize: "0.85rem", color: "#374151" },
  eq: { margin: "0 0 12px", fontSize: "0.82rem", color: "#9ca3af" },
  fuelTag: { display: "inline-block", padding: "4px 14px", borderRadius: "20px", background: "#f0fdf4", color: "#166534", fontSize: "0.82rem", fontWeight: 700, border: "1px solid #bbf7d0" },
};

export default function SearchTrip({ user, setPage }) {
  const { theme } = useTheme();
  const [trips, setTrips] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "", date: "" });
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [celebration, setCelebration] = useState(null);

  const fetchTrips = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.from) params.append("from", filters.from);
    if (filters.to)   params.append("to", filters.to);
    if (filters.date) params.append("date", filters.date);
    fetch(`http://localhost:5000/api/trips?${params}`)
      .then(res => res.json())
      .then(data => setTrips(data.trips ?? []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTrips(); }, []);

  const prenota = async (trip) => {
    if (!user) { setPage("login"); return; }
    setBookingId(trip.id);
    try {
      const res = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_viaggio: trip.id, id_passeggero: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        const km = estimateKm(trip.citta_partenza, trip.citta_arrivo);
        setCelebration({ km, fuelType: trip.carburante_veicolo || "benzina" });
        fetchTrips();
      } else {
        alert(data.message || "Errore durante la prenotazione.");
      }
    } catch { alert("Errore di connessione."); }
    finally { setBookingId(null); }
  };

  const handleKey = (e) => { if (e.key === "Enter") fetchTrips(); };

  const futureTrips = trips.filter(t => !isPastTrip(t));
  const pastTrips   = trips.filter(t => isPastTrip(t));
  const hasFilters  = filters.from || filters.to || filters.date;

  const s = makeStyles(theme);

  return (
    <div style={s.wrapper}>
      {celebration && (
        <Co2Celebration km={celebration.km} fuelType={celebration.fuelType} onDone={() => setCelebration(null)} />
      )}

      <h2 style={s.title}>🔍 Cerca un viaggio</h2>

      <div style={s.filterCard}>
        <div style={s.filterRow}>
          <div style={s.filterField}>
            <label style={s.filterLabel}>Da</label>
            <input style={s.filterInput} placeholder="es. Milano" value={filters.from}
              onChange={e => setFilters({ ...filters, from: e.target.value })} onKeyDown={handleKey} />
          </div>
          <div style={s.filterField}>
            <label style={s.filterLabel}>A</label>
            <input style={s.filterInput} placeholder="es. Roma" value={filters.to}
              onChange={e => setFilters({ ...filters, to: e.target.value })} onKeyDown={handleKey} />
          </div>
          <div style={s.filterField}>
            <label style={s.filterLabel}>Data</label>
            <input style={s.filterInput} type="date" value={filters.date}
              onChange={e => setFilters({ ...filters, date: e.target.value })} />
          </div>
          <button style={s.searchBtn} onClick={fetchTrips}>Cerca</button>
        </div>
      </div>

      {loading && <p style={s.status}>Caricamento…</p>}

      {!loading && trips.length === 0 && (
        <div style={s.emptyState}>
          <p style={{ fontSize: "2rem", margin: "0 0 8px" }}>🚗</p>
          <p style={{ color: theme.textMuted }}>Nessun viaggio trovato.</p>
        </div>
      )}

      {futureTrips.length > 0 && (
        <>
          {(pastTrips.length > 0 || hasFilters) && <h3 style={s.groupLabel}>Prossimi viaggi</h3>}
          <div style={s.list}>
            {futureTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} past={false} user={user} bookingId={bookingId} onPrenota={prenota} setPage={setPage} theme={theme} />
            ))}
          </div>
        </>
      )}

      {pastTrips.length > 0 && (
        <>
          <h3 style={{ ...s.groupLabel, marginTop: "28px", color: theme.textLight }}>Viaggi già effettuati</h3>
          <div style={s.list}>
            {pastTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} past={true} user={user} bookingId={bookingId} onPrenota={prenota} setPage={setPage} theme={theme} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TripCard({ trip, past, user, bookingId, onPrenota, setPage, theme }) {
  const postiLiberi = trip.posti_liberi ?? (trip.posti - (trip.prenotazioni_attive ?? 0));
  const esaurito = postiLiberi <= 0;
  const isMio = user && trip.offerente_id === user.id;
  const km = estimateKm(trip.citta_partenza, trip.citta_arrivo);
  const fuelType = trip.carburante_veicolo || "benzina";
  const fuel = FUEL_TYPES[fuelType] || FUEL_TYPES.benzina;
  const co2 = co2Saved(km, fuelType);

  const s = makeStyles(theme);

  return (
    <div style={{ ...s.card, ...(past ? s.cardPast : {}) }}>
      <div style={s.cardHeader}>
        <span style={{ ...s.route, color: past ? theme.textLight : theme.text }}>
          <strong>{trip.citta_partenza}</strong>
          <span style={{ color: past ? theme.border : theme.primary, fontWeight: 700 }}> ➜ </span>
          <strong>{trip.citta_arrivo}</strong>
        </span>

        {past ? (
          <span style={{ ...s.badge, background: theme.surfaceAlt, color: theme.textLight }}>Già effettuato</span>
        ) : esaurito ? (
          <span style={{ ...s.badge, background: theme.error, color: theme.errorText }}>🚫 Esaurito</span>
        ) : (
          <span style={{ ...s.badge, background: theme.success, color: theme.successText }}>
            💺 {postiLiberi} {postiLiberi === 1 ? "posto" : "posti"}
          </span>
        )}
      </div>

      <div style={s.infoRow}>
        <span style={{ ...s.infoItem, color: past ? theme.textLight : theme.textMuted }}>📅 {trip.data_viaggio}</span>
        <span style={{ ...s.infoItem, color: past ? theme.textLight : theme.textMuted }}>🕐 {trip.ora_partenza} → {trip.ora_arrivo}</span>
        {!past && (
          <span style={{ ...s.infoItem, color: "#16a34a", fontWeight: 600 }}>
            {fuel.icon} ~{co2} kg CO₂ risparmiate
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
        <span style={{ ...s.infoItem, color: past ? theme.textLight : theme.textMuted }}>
          🧑 {trip.offerente_nome} {trip.offerente_cognome}
        </span>
        {trip.voto_medio_autista > 0 && !past && (
          <StarRating value={trip.voto_medio_autista} count={trip.num_feedback} />
        )}
        {!past && (
          <span style={{ ...s.fuelChip, background: theme.surfaceAlt, border: `1px solid ${theme.border}`, color: theme.textMuted }}>
            {fuel.icon} {fuel.label.split(" ")[0]}
          </span>
        )}
      </div>

      {trip.descrizione && !past && (
        <p style={{ margin: "8px 0 0", color: theme.textMuted, fontSize: "0.85rem", fontStyle: "italic" }}>📝 {trip.descrizione}</p>
      )}

      {!past && (
        <div style={{ marginTop: "14px" }}>
          {isMio ? (
            <span style={{ color: "#16a34a", fontWeight: 600, fontSize: "0.85rem" }}>✅ Questo è il tuo viaggio</span>
          ) : esaurito ? (
            <span style={{ color: theme.textLight, fontSize: "0.85rem" }}>Posti esauriti</span>
          ) : !user ? (
            <button style={s.bookBtn} onClick={() => setPage("login")}>Accedi per prenotare</button>
          ) : (
            <button
              style={{ ...s.bookBtn, opacity: bookingId === trip.id ? 0.7 : 1 }}
              onClick={() => onPrenota(trip)}
              disabled={bookingId === trip.id}
            >
              {bookingId === trip.id ? "Prenotazione…" : "Prenota"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function makeStyles(theme) {
  return {
    wrapper: { maxWidth: "800px", margin: "0 auto", padding: "32px 16px" },
    title: { fontSize: "1.6rem", fontWeight: 800, color: theme.text, marginBottom: "20px" },
    filterCard: { background: theme.surface, borderRadius: "14px", boxShadow: theme.shadow, padding: "18px 22px", marginBottom: "24px" },
    filterRow: { display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" },
    filterField: { flex: 1, minWidth: "120px" },
    filterLabel: { display: "block", marginBottom: "5px", fontSize: "0.78rem", fontWeight: 600, color: theme.textMuted },
    filterInput: { width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1.5px solid ${theme.border}`, fontSize: "0.9rem", outline: "none", boxSizing: "border-box", background: theme.surface, color: theme.text },
    searchBtn: { padding: "9px 22px", borderRadius: "8px", border: "none", background: theme.primary, color: "#fff", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
    status: { textAlign: "center", color: theme.textMuted, padding: "24px 0" },
    emptyState: { textAlign: "center", padding: "48px 0" },
    groupLabel: { fontSize: "0.92rem", fontWeight: 700, color: theme.textMuted, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.5px" },
    list: { display: "flex", flexDirection: "column", gap: "12px" },
    card: { background: theme.surface, borderRadius: "14px", boxShadow: theme.shadow, padding: "18px 22px" },
    cardPast: { background: theme.cardPastBg, boxShadow: "none", border: `1px solid ${theme.border}` },
    cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "8px" },
    route: { fontSize: "1.05rem" },
    badge: { padding: "3px 10px", borderRadius: "10px", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 },
    infoRow: { display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "2px" },
    infoItem: { fontSize: "0.86rem" },
    fuelChip: { padding: "2px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 600 },
    bookBtn: { padding: "8px 20px", borderRadius: "8px", border: "none", background: "#16a34a", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.88rem" },
  };
}
