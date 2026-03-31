import { useEffect, useState } from "react";

const TODAY = new Date().toISOString().split("T")[0];

function isPastTrip(trip) {
  if (trip.data_viaggio < TODAY) return true;
  if (trip.data_viaggio === TODAY) {
    const now = new Date().toTimeString().slice(0, 5);
    return (trip.ora_partenza || "23:59") < now;
  }
  return false;
}

// Stima km tra due città italiane con tabella lookup + fallback
const DISTANCES = {
  "milano-roma": 570, "roma-milano": 570,
  "milano-napoli": 770, "napoli-milano": 770,
  "roma-napoli": 220, "napoli-roma": 220,
  "milano-torino": 140, "torino-milano": 140,
  "milano-bologna": 210, "bologna-milano": 210,
  "roma-firenze": 277, "firenze-roma": 277,
  "bologna-firenze": 100, "firenze-bologna": 100,
  "milano-firenze": 300, "firenze-milano": 300,
  "torino-roma": 690, "roma-torino": 690,
  "venezia-milano": 270, "milano-venezia": 270,
  "venezia-roma": 530, "roma-venezia": 530,
  "napoli-palermo": 490, "palermo-napoli": 490,
  "bari-roma": 450, "roma-bari": 450,
  "brescia-milano": 90, "milano-brescia": 90,
  "brescia-roma": 510, "roma-brescia": 510,
  "brescia-venezia": 130, "venezia-brescia": 130,
  "bergamo-milano": 55, "milano-bergamo": 55,
  "verona-milano": 160, "milano-verona": 160,
  "genova-milano": 140, "milano-genova": 140,
};

function estimateKm(from, to) {
  const key = `${from.toLowerCase().trim()}-${to.toLowerCase().trim()}`;
  return DISTANCES[key] || Math.floor(Math.random() * 300 + 100); // fallback stimato
}

// CO₂ risparmiata: auto media ~120g/km, per passeggero che non usa la propria auto
function co2Saved(km) {
  return ((km * 120) / 1000).toFixed(1); // kg CO₂
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

// Componente animazione CO₂ al momento della prenotazione
function Co2Celebration({ km, onDone }) {
  const kg = co2Saved(km);
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={cel.overlay}>
      <div style={cel.box}>
        <div style={cel.leaf}>🌿</div>
        <p style={cel.title}>Prenotazione effettuata!</p>
        <p style={cel.sub}>Scegliendo il carpooling hai risparmiato circa</p>
        <p style={cel.kg}>{kg} kg</p>
        <p style={cel.label}>di CO₂ rispetto a guidare da solo</p>
        <p style={cel.eq}>≈ {Math.round(kg * 4)} km in auto solo tua 🚗💨</p>
      </div>
    </div>
  );
}

const cel = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, animation: "fadeIn 0.3s ease" },
  box: { background: "#fff", borderRadius: "20px", padding: "40px 36px", textAlign: "center", maxWidth: "340px", width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" },
  leaf: { fontSize: "3.5rem", marginBottom: "8px", animation: "bounce 0.6s ease" },
  title: { margin: "0 0 8px", fontSize: "1.3rem", fontWeight: 800, color: "#166534" },
  sub: { margin: "0 0 4px", fontSize: "0.88rem", color: "#555" },
  kg: { margin: "8px 0 2px", fontSize: "3rem", fontWeight: 900, color: "#16a34a" },
  label: { margin: "0 0 12px", fontSize: "0.85rem", color: "#374151" },
  eq: { margin: 0, fontSize: "0.82rem", color: "#9ca3af" },
};

export default function SearchTrip({ user, setPage }) {
  const [trips, setTrips] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "", date: "" });
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [celebration, setCelebration] = useState(null); // { km }

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
        setCelebration({ km });
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

  return (
    <div style={styles.wrapper}>
      {celebration && (
        <Co2Celebration km={celebration.km} onDone={() => setCelebration(null)} />
      )}

      <h2 style={styles.title}>🔍 Cerca un viaggio</h2>

      {/* Filtri */}
      <div style={styles.filterCard}>
        <div style={styles.filterRow}>
          <div style={styles.filterField}>
            <label style={styles.filterLabel}>Da</label>
            <input style={styles.filterInput} placeholder="es. Milano" value={filters.from}
              onChange={e => setFilters({ ...filters, from: e.target.value })} onKeyDown={handleKey} />
          </div>
          <div style={styles.filterField}>
            <label style={styles.filterLabel}>A</label>
            <input style={styles.filterInput} placeholder="es. Roma" value={filters.to}
              onChange={e => setFilters({ ...filters, to: e.target.value })} onKeyDown={handleKey} />
          </div>
          <div style={styles.filterField}>
            <label style={styles.filterLabel}>Data</label>
            <input style={styles.filterInput} type="date" value={filters.date}
              onChange={e => setFilters({ ...filters, date: e.target.value })} />
          </div>
          <button style={styles.searchBtn} onClick={fetchTrips}>Cerca</button>
        </div>
      </div>

      {loading && <p style={styles.status}>Caricamento…</p>}

      {!loading && trips.length === 0 && (
        <div style={styles.emptyState}>
          <p style={{ fontSize: "2rem", margin: "0 0 8px" }}>🚗</p>
          <p style={{ color: "#666" }}>Nessun viaggio trovato.</p>
        </div>
      )}

      {/* Viaggi futuri */}
      {futureTrips.length > 0 && (
        <>
          {(pastTrips.length > 0 || hasFilters) && (
            <h3 style={styles.groupLabel}>Prossimi viaggi</h3>
          )}
          <div style={styles.list}>
            {futureTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} past={false} user={user} bookingId={bookingId} onPrenota={prenota} setPage={setPage} />
            ))}
          </div>
        </>
      )}

      {/* Viaggi passati */}
      {pastTrips.length > 0 && (
        <>
          <h3 style={{ ...styles.groupLabel, marginTop: "28px", color: "#9ca3af" }}>Viaggi già effettuati</h3>
          <div style={styles.list}>
            {pastTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} past={true} user={user} bookingId={bookingId} onPrenota={prenota} setPage={setPage} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TripCard({ trip, past, user, bookingId, onPrenota, setPage }) {
  const postiLiberi = trip.posti_liberi ?? (trip.posti - (trip.prenotazioni_attive ?? 0));
  const esaurito = postiLiberi <= 0;
  const isMio = user && trip.offerente_id === user.id;
  const km = estimateKm(trip.citta_partenza, trip.citta_arrivo);

  return (
    <div style={{ ...styles.card, ...(past ? styles.cardPast : {}) }}>
      {/* Header */}
      <div style={styles.cardHeader}>
        <span style={{ ...styles.route, color: past ? "#9ca3af" : "#1a1a2e" }}>
          <strong>{trip.citta_partenza}</strong>
          <span style={{ color: past ? "#d1d5db" : "#2563eb", fontWeight: 700 }}> ➜ </span>
          <strong>{trip.citta_arrivo}</strong>
        </span>

        {past ? (
          <span style={styles.badgePast}>Già effettuato</span>
        ) : esaurito ? (
          <span style={{ ...styles.badge, background: "#fee2e2", color: "#991b1b" }}>🚫 Esaurito</span>
        ) : (
          <span style={{ ...styles.badge, background: "#dcfce7", color: "#166534" }}>
            💺 {postiLiberi} {postiLiberi === 1 ? "posto" : "posti"}
          </span>
        )}
      </div>

      {/* Info riga */}
      <div style={styles.infoRow}>
        <span style={{ ...styles.infoItem, color: past ? "#9ca3af" : "#555" }}>
          📅 {trip.data_viaggio}
        </span>
        <span style={{ ...styles.infoItem, color: past ? "#9ca3af" : "#555" }}>
          🕐 {trip.ora_partenza} → {trip.ora_arrivo}
        </span>
        {!past && (
          <span style={{ ...styles.infoItem, color: "#16a34a", fontWeight: 600 }}>
            🌿 ~{co2Saved(km)} kg CO₂ risparmiate
          </span>
        )}
      </div>

      {/* Autista + stelle */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
        <span style={{ ...styles.infoItem, color: past ? "#9ca3af" : "#555" }}>
          🧑 {trip.offerente_nome} {trip.offerente_cognome}
        </span>
        {trip.voto_medio_autista > 0 && !past && (
          <StarRating value={trip.voto_medio_autista} count={trip.num_feedback} />
        )}
      </div>

      {trip.descrizione && !past && (
        <p style={styles.desc}>📝 {trip.descrizione}</p>
      )}

      {/* Footer azioni — solo viaggi futuri */}
      {!past && (
        <div style={styles.cardFooter}>
          {isMio ? (
            <span style={styles.myLabel}>✅ Questo è il tuo viaggio</span>
          ) : esaurito ? (
            <span style={styles.fullLabel}>Posti esauriti</span>
          ) : !user ? (
            <button style={styles.bookBtn} onClick={() => setPage("login")}>Accedi per prenotare</button>
          ) : (
            <button
              style={{ ...styles.bookBtn, opacity: bookingId === trip.id ? 0.7 : 1 }}
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

const styles = {
  wrapper: { maxWidth: "800px", margin: "0 auto", padding: "32px 16px" },
  title: { fontSize: "1.6rem", fontWeight: 800, color: "#1a1a2e", marginBottom: "20px" },
  filterCard: { background: "#fff", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: "18px 22px", marginBottom: "24px" },
  filterRow: { display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" },
  filterField: { flex: 1, minWidth: "120px" },
  filterLabel: { display: "block", marginBottom: "5px", fontSize: "0.78rem", fontWeight: 600, color: "#6b7280" },
  filterInput: { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #d1d5db", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" },
  searchBtn: { padding: "9px 22px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  status: { textAlign: "center", color: "#888", padding: "24px 0" },
  emptyState: { textAlign: "center", padding: "48px 0" },
  groupLabel: { fontSize: "0.92rem", fontWeight: 700, color: "#374151", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.5px" },
  list: { display: "flex", flexDirection: "column", gap: "12px" },

  // Card futura
  card: { background: "#fff", borderRadius: "14px", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", padding: "18px 22px" },
  // Card passata — stesso layout, solo colori spenti
  cardPast: { background: "#fafafa", boxShadow: "none", border: "1px solid #e5e7eb" },

  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "8px" },
  route: { fontSize: "1.05rem" },

  // Badge unificati — stessa forma, colori diversi
  badge: { padding: "3px 10px", borderRadius: "10px", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 },
  badgePast: { padding: "3px 10px", borderRadius: "10px", fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0, background: "#f3f4f6", color: "#9ca3af" },

  infoRow: { display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "2px" },
  infoItem: { fontSize: "0.86rem" },
  desc: { margin: "8px 0 0", color: "#777", fontSize: "0.85rem", fontStyle: "italic" },
  cardFooter: { marginTop: "14px" },
  bookBtn: { padding: "8px 20px", borderRadius: "8px", border: "none", background: "#16a34a", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.88rem" },
  myLabel: { color: "#16a34a", fontWeight: 600, fontSize: "0.85rem" },
  fullLabel: { color: "#9ca3af", fontSize: "0.85rem" },
};
