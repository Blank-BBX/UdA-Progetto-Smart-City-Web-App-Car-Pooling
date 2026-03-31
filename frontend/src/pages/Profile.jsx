import { useState, useEffect } from "react";

function StarRating({ value }) {
  if (!value) return <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Nessuna valutazione</span>;
  const rounded = Math.round(value);
  return (
    <span style={{ color: "#f59e0b", fontSize: "1rem", letterSpacing: "2px" }}>
      {"★".repeat(rounded)}{"☆".repeat(5 - rounded)}
      <span style={{ color: "#92400e", fontWeight: 700, fontSize: "0.88rem", marginLeft: "6px" }}>
        {Number(value).toFixed(1)} / 5
      </span>
    </span>
  );
}

export default function Profile({ user, setUser, setPage }) {
  const [vehicles, setVehicles]         = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [votoMedio, setVotoMedio]       = useState(null);
  const [loadingV, setLoadingV]         = useState(true);
  const [loadingF, setLoadingF]         = useState(true);
  const [form, setForm]   = useState({ modello: "", targa: "", posti: "4" });
  const [adding, setAdding] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("veicoli"); // "veicoli" | "feedback"

  if (!user) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <p>⚠️ Devi essere loggato per accedere al profilo.</p>
          <button style={styles.btnPrimary} onClick={() => setPage("login")}>Vai al Login</button>
        </div>
      </div>
    );
  }

  const loadVehicles = () => {
    setLoadingV(true);
    fetch(`http://localhost:5000/api/vehicles?id_utente=${user.id}`)
      .then(r => r.json())
      .then(d => setVehicles(d.vehicles ?? []))
      .catch(() => {})
      .finally(() => setLoadingV(false));
  };

  const loadFeedback = () => {
    setLoadingF(true);
    fetch(`http://localhost:5000/api/feedback/${user.id}`)
      .then(r => r.json())
      .then(d => {
        setFeedbackList(d.feedback ?? []);
        setVotoMedio(d.votoMedio ?? null);
      })
      .catch(() => {})
      .finally(() => setLoadingF(false));
  };

  useEffect(() => { loadVehicles(); loadFeedback(); }, [user.id]);

  const addVehicle = async () => {
    setError(""); setSuccess("");
    if (!form.modello.trim() || !form.targa.trim() || !form.posti) {
      setError("Compila tutti i campi del veicolo."); return;
    }
    setAdding(true);
    try {
      const res = await fetch("http://localhost:5000/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_utente: user.id, modello: form.modello.trim(), targa: form.targa.trim().toUpperCase(), posti: Number(form.posti) }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Veicolo aggiunto! Sei ora un autista 🚗");
        setForm({ modello: "", targa: "", posti: "4" });
        loadVehicles();
        const updatedUser = { ...user, tipo: "autista" };
        setUser(updatedUser);
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        setError(data.message || "Errore durante il salvataggio.");
      }
    } catch { setError("Impossibile contattare il server."); }
    finally { setAdding(false); }
  };

  const removeVehicle = async (vehicleId) => {
    if (!window.confirm("Rimuovere questo veicolo?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/vehicles/${vehicleId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_utente: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = vehicles.filter(v => v.id !== vehicleId);
        setVehicles(updated);
        if (updated.length === 0) {
          const updatedUser = { ...user, tipo: "passeggero" };
          setUser(updatedUser);
          sessionStorage.setItem("user", JSON.stringify(updatedUser));
          setSuccess("Veicolo rimosso. Sei tornato passeggero.");
        } else {
          setSuccess("Veicolo rimosso.");
        }
      } else { setError(data.message || "Errore."); }
    } catch { setError("Impossibile contattare il server."); }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>

        {/* Header profilo */}
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>{user.nome[0]}{user.cognome[0]}</div>
          <div style={{ flex: 1 }}>
            <h2 style={styles.name}>{user.nome} {user.cognome}</h2>
            <p style={styles.meta}>{user.email}</p>
            {user.telefono && <p style={styles.meta}>📞 {user.telefono}</p>}
            <div style={styles.headerBottom}>
              <span style={{
                ...styles.tipoBadge,
                background: user.tipo === "autista" ? "#dcfce7" : "#dbeafe",
                color: user.tipo === "autista" ? "#166534" : "#1e40af",
              }}>
                {user.tipo === "autista" ? "🚙 Autista" : "👤 Passeggero"}
              </span>
              {votoMedio !== null && (
                <div style={styles.ratingBox}>
                  <StarRating value={votoMedio} />
                  <span style={styles.ratingCount}>({feedbackList.length} {feedbackList.length === 1 ? "recensione" : "recensioni"})</span>
                </div>
              )}
              {votoMedio === null && feedbackList.length === 0 && !loadingF && (
                <span style={{ fontSize: "0.82rem", color: "#9ca3af", marginLeft: "10px" }}>Nessuna recensione ancora</span>
              )}
            </div>
          </div>
        </div>

        {error   && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        {/* Tabs */}
        <div style={styles.tabs}>
          <button style={{ ...styles.tab, ...(activeTab === "veicoli" ? styles.tabActive : {}) }} onClick={() => setActiveTab("veicoli")}>
            🚗 I miei veicoli
          </button>
          <button style={{ ...styles.tab, ...(activeTab === "feedback" ? styles.tabActive : {}) }} onClick={() => setActiveTab("feedback")}>
            ⭐ Recensioni ricevute
            {feedbackList.length > 0 && <span style={styles.tabBadge}>{feedbackList.length}</span>}
          </button>
        </div>

        {/* TAB VEICOLI */}
        {activeTab === "veicoli" && (
          <div style={styles.section}>
            {user.tipo === "passeggero" && (
              <div style={styles.infoBox}>
                ℹ️ Aggiungi un veicolo per diventare autista e poter offrire viaggi.
              </div>
            )}
            {loadingV ? <p style={{ color: "#888" }}>Caricamento…</p>
              : vehicles.length === 0 ? <p style={{ color: "#888" }}>Nessun veicolo registrato.</p>
              : (
                <div style={styles.vehicleList}>
                  {vehicles.map(v => (
                    <div key={v.id} style={styles.vehicleCard}>
                      <div>
                        <p style={styles.vehicleModel}>🚗 {v.modello}</p>
                        <p style={styles.vehicleMeta}>Targa: <strong>{v.targa}</strong> &nbsp;|&nbsp; 💺 {v.posti} posti</p>
                      </div>
                      <button style={styles.removeBtn} onClick={() => removeVehicle(v.id)}>Rimuovi</button>
                    </div>
                  ))}
                </div>
              )
            }

            <div style={styles.addForm}>
              <h4 style={styles.addTitle}>➕ Aggiungi un veicolo</h4>
              <div style={styles.formRow}>
                <div style={styles.formField}>
                  <label style={styles.label}>Modello *</label>
                  <input style={styles.input} placeholder="es. Fiat Panda" value={form.modello} onChange={e => setForm({ ...form, modello: e.target.value })} />
                </div>
                <div style={styles.formField}>
                  <label style={styles.label}>Targa *</label>
                  <input style={styles.input} placeholder="es. AB123CD" value={form.targa} onChange={e => setForm({ ...form, targa: e.target.value })} />
                </div>
                <div style={{ ...styles.formField, maxWidth: "110px" }}>
                  <label style={styles.label}>Posti *</label>
                  <input style={styles.input} type="number" min="1" max="9" value={form.posti} onChange={e => setForm({ ...form, posti: e.target.value })} />
                </div>
              </div>
              <button style={{ ...styles.btnPrimary, opacity: adding ? 0.7 : 1 }} onClick={addVehicle} disabled={adding}>
                {adding ? "Salvataggio…" : "Aggiungi veicolo"}
              </button>
            </div>
          </div>
        )}

        {/* TAB FEEDBACK */}
        {activeTab === "feedback" && (
          <div style={styles.section}>
            {loadingF && <p style={{ color: "#888" }}>Caricamento recensioni…</p>}

            {!loadingF && feedbackList.length === 0 && (
              <div style={styles.emptyFeedback}>
                <p style={{ fontSize: "2rem", margin: "0 0 8px" }}>⭐</p>
                <p style={{ color: "#6b7280" }}>Non hai ancora ricevuto nessuna recensione.</p>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Le recensioni appariranno qui dopo che qualcuno ti valuterà.</p>
              </div>
            )}

            {/* Riepilogo voto medio */}
            {feedbackList.length > 0 && (
              <div style={styles.avgBox}>
                <div style={styles.avgScore}>{Number(votoMedio).toFixed(1)}</div>
                <div>
                  <StarRating value={votoMedio} />
                  <p style={styles.avgCount}>{feedbackList.length} {feedbackList.length === 1 ? "recensione" : "recensioni"}</p>
                </div>
              </div>
            )}

            <div style={styles.feedbackList}>
              {feedbackList.map(f => (
                <div key={f.id} style={styles.feedbackCard}>
                  <div style={styles.feedbackTop}>
                    <div>
                      <span style={styles.feedbackAuthor}>
                        {f.autore_nome} {f.autore_cognome}
                      </span>
                      {f.citta_partenza && (
                        <span style={styles.feedbackTrip}>
                          &nbsp;· {f.citta_partenza} → {f.citta_arrivo} ({f.data_viaggio})
                        </span>
                      )}
                    </div>
                    <div style={styles.feedbackStars}>
                      {"★".repeat(f.voto)}{"☆".repeat(5 - f.voto)}
                    </div>
                  </div>
                  {f.commento && <p style={styles.feedbackComment}>"{f.commento}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Azioni rapide */}
        <div style={styles.actions}>
          {user.tipo === "autista" && (
            <button style={styles.actionBtn} onClick={() => setPage("create")}>🚗 Offri un viaggio</button>
          )}
          <button style={styles.actionBtn} onClick={() => setPage("search")}>🔍 Cerca un viaggio</button>
          <button style={styles.actionBtn} onClick={() => setPage("feedback")}>⭐ Lascia un feedback</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { padding: "32px 16px", display: "flex", justifyContent: "center" },
  container: { width: "100%", maxWidth: "700px" },
  profileHeader: { display: "flex", gap: "20px", alignItems: "flex-start", background: "#fff", borderRadius: "16px", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", padding: "28px", marginBottom: "20px" },
  avatar: { width: "64px", height: "64px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 700, flexShrink: 0, textTransform: "uppercase" },
  name: { margin: "0 0 4px", fontSize: "1.4rem", fontWeight: 700, color: "#1a1a2e" },
  meta: { margin: "2px 0", color: "#6b7280", fontSize: "0.88rem" },
  headerBottom: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "8px" },
  tipoBadge: { display: "inline-block", padding: "4px 14px", borderRadius: "12px", fontSize: "0.82rem", fontWeight: 700 },
  ratingBox: { display: "flex", alignItems: "center", gap: "6px" },
  ratingCount: { fontSize: "0.8rem", color: "#9ca3af" },

  errorBox: { background: "#fff0f0", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "0.88rem" },
  successBox: { background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "0.88rem" },

  tabs: { display: "flex", gap: "4px", background: "#f3f4f6", padding: "4px", borderRadius: "12px", marginBottom: "16px" },
  tab: { flex: 1, padding: "10px 16px", borderRadius: "9px", border: "none", background: "transparent", color: "#6b7280", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" },
  tabActive: { background: "#fff", color: "#1a1a2e", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
  tabBadge: { background: "#2563eb", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "0.72rem", fontWeight: 700 },

  section: { background: "#fff", borderRadius: "16px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", padding: "24px", marginBottom: "20px" },
  infoBox: { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "0.88rem" },

  vehicleList: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" },
  vehicleCard: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb", borderRadius: "10px", padding: "14px 16px", border: "1.5px solid #e5e7eb" },
  vehicleModel: { margin: "0 0 4px", fontWeight: 700, color: "#1a1a2e" },
  vehicleMeta: { margin: 0, color: "#555", fontSize: "0.85rem" },
  removeBtn: { padding: "6px 14px", borderRadius: "6px", border: "1px solid #fca5a5", background: "#fff0f0", color: "#b91c1c", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 },

  addForm: { borderTop: "1.5px solid #f3f4f6", paddingTop: "18px" },
  addTitle: { margin: "0 0 14px", fontSize: "0.92rem", fontWeight: 700, color: "#374151" },
  formRow: { display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "14px" },
  formField: { flex: 1, minWidth: "110px" },
  label: { display: "block", marginBottom: "5px", fontWeight: 600, fontSize: "0.8rem", color: "#374151" },
  input: { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #d1d5db", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" },
  btnPrimary: { padding: "10px 24px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" },

  // Feedback tab
  emptyFeedback: { textAlign: "center", padding: "32px 0" },
  avgBox: { display: "flex", alignItems: "center", gap: "20px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px" },
  avgScore: { fontSize: "2.8rem", fontWeight: 800, color: "#92400e", lineHeight: 1 },
  avgCount: { margin: "4px 0 0", color: "#6b7280", fontSize: "0.82rem" },
  feedbackList: { display: "flex", flexDirection: "column", gap: "12px" },
  feedbackCard: { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "14px 16px" },
  feedbackTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" },
  feedbackAuthor: { fontWeight: 700, fontSize: "0.9rem", color: "#1a1a2e" },
  feedbackTrip: { fontSize: "0.8rem", color: "#6b7280" },
  feedbackStars: { color: "#f59e0b", fontSize: "0.95rem", letterSpacing: "1px", whiteSpace: "nowrap" },
  feedbackComment: { margin: 0, color: "#374151", fontSize: "0.88rem", fontStyle: "italic" },

  actions: { display: "flex", gap: "10px", flexWrap: "wrap" },
  actionBtn: { padding: "10px 20px", borderRadius: "10px", border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: "0.88rem" },
};
