import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { FUEL_TYPES } from "../utils/co2";

function StarRating({ value }) {
  const { theme } = useTheme();
  if (!value) return <span style={{ color: theme.textLight, fontSize: "0.85rem" }}>Nessuna valutazione</span>;
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
  const { theme } = useTheme();
  const [vehicles, setVehicles]         = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [votoMedio, setVotoMedio]       = useState(null);
  const [loadingV, setLoadingV]         = useState(true);
  const [loadingF, setLoadingF]         = useState(true);
  const [form, setForm]   = useState({ modello: "", targa: "", posti: "4", carburante: "benzina" });
  const [adding, setAdding] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("veicoli");

  const s = makeStyles(theme);

  if (!user) {
    return (
      <div style={s.wrapper}>
        <div style={s.card}>
          <p style={{ color: theme.text }}>⚠️ Devi essere loggato per accedere al profilo.</p>
          <button style={s.btnPrimary} onClick={() => setPage("login")}>Vai al Login</button>
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
      .then(d => { setFeedbackList(d.feedback ?? []); setVotoMedio(d.votoMedio ?? null); })
      .catch(() => {})
      .finally(() => setLoadingF(false));
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
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
        body: JSON.stringify({
          id_utente: user.id,
          modello: form.modello.trim(),
          targa: form.targa.trim().toUpperCase(),
          posti: Number(form.posti),
          carburante: form.carburante,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Veicolo aggiunto! Sei ora un autista 🚗");
        setForm({ modello: "", targa: "", posti: "4", carburante: "benzina" });
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
    <div style={s.wrapper}>
      <div style={s.container}>
        {/* Header profilo */}
        <div style={s.profileHeader}>
          <div style={s.avatar}>{user.nome[0]}{user.cognome[0]}</div>
          <div style={{ flex: 1 }}>
            <h2 style={s.name}>{user.nome} {user.cognome}</h2>
            <p style={s.meta}>{user.email}</p>
            {user.telefono && <p style={s.meta}>📞 {user.telefono}</p>}
            <div style={s.headerBottom}>
              <span style={{
                ...s.tipoBadge,
                background: user.tipo === "autista" ? theme.driverBadgeBg : theme.passengerBadgeBg,
                color: user.tipo === "autista" ? theme.driverBadgeColor : theme.passengerBadgeColor,
              }}>
                {user.tipo === "autista" ? "🚙 Autista" : "👤 Passeggero"}
              </span>
              {votoMedio !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <StarRating value={votoMedio} />
                  <span style={{ fontSize: "0.8rem", color: theme.textLight }}>
                    ({feedbackList.length} {feedbackList.length === 1 ? "recensione" : "recensioni"})
                  </span>
                </div>
              )}
              {votoMedio === null && feedbackList.length === 0 && !loadingF && (
                <span style={{ fontSize: "0.82rem", color: theme.textLight, marginLeft: "10px" }}>Nessuna recensione ancora</span>
              )}
            </div>
          </div>
        </div>

        {error   && <div style={s.errorBox}>{error}</div>}
        {success && <div style={s.successBox}>{success}</div>}

        {/* Tabs */}
        <div style={s.tabs}>
          {[["veicoli", "🚗 I miei veicoli"], ["feedback", "⭐ Recensioni ricevute"]].map(([key, label]) => (
            <button key={key} style={{ ...s.tab, ...(activeTab === key ? s.tabActive : {}) }} onClick={() => setActiveTab(key)}>
              {label}
              {key === "feedback" && feedbackList.length > 0 && (
                <span style={s.tabBadge}>{feedbackList.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* TAB VEICOLI */}
        {activeTab === "veicoli" && (
          <div style={s.section}>
            {user.tipo === "passeggero" && (
              <div style={s.infoBox}>
                🚗 Aggiungi un veicolo per diventare autista e offrire passaggi.
              </div>
            )}
            {loadingV ? <p style={{ color: theme.textMuted }}>Caricamento veicoli…</p>
              : vehicles.length === 0 ? <p style={{ color: theme.textMuted }}>Nessun veicolo registrato.</p>
              : (
                <div style={s.vehicleList}>
                  {vehicles.map(v => {
                    const fuel = FUEL_TYPES[v.carburante];
                    return (
                      <div key={v.id} style={s.vehicleCard}>
                        <div>
                          <p style={s.vehicleModel}>🚗 {v.modello}</p>
                          <p style={s.vehicleMeta}>
                            Targa: <strong>{v.targa}</strong> &nbsp;|&nbsp; 💺 {v.posti} posti
                            {fuel && <> &nbsp;|&nbsp; {fuel.icon} {fuel.label.split(" ")[0]}</>}
                          </p>
                          {fuel && (
                            <p style={{ ...s.vehicleMeta, color: "#16a34a", marginTop: "2px" }}>
                              🌿 ~{fuel.gPerKm} g CO₂/km
                            </p>
                          )}
                        </div>
                        <button style={s.removeBtn} onClick={() => removeVehicle(v.id)}>Rimuovi</button>
                      </div>
                    );
                  })}
                </div>
              )
            }

            <div style={s.addForm}>
              <h4 style={s.addTitle}>➕ Aggiungi un veicolo</h4>
              <div style={s.formRow}>
                <div style={s.formField}>
                  <label style={s.label}>Modello *</label>
                  <input style={s.input} placeholder="es. Fiat Panda" value={form.modello} onChange={e => setForm({ ...form, modello: e.target.value })} />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>Targa *</label>
                  <input style={s.input} placeholder="es. AB123CD" value={form.targa} onChange={e => setForm({ ...form, targa: e.target.value })} />
                </div>
                <div style={{ ...s.formField, maxWidth: "90px" }}>
                  <label style={s.label}>Posti *</label>
                  <input style={s.input} type="number" min="1" max="9" value={form.posti} onChange={e => setForm({ ...form, posti: e.target.value })} />
                </div>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={s.label}>Tipo di carburante *</label>
                <div style={s.fuelGrid}>
                  {Object.entries(FUEL_TYPES).map(([key, fuel]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm({ ...form, carburante: key })}
                      style={{
                        ...s.fuelOption,
                        ...(form.carburante === key ? s.fuelOptionSelected : {}),
                      }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>{fuel.icon}</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{fuel.label.split(" ")[0]}</span>
                      <span style={{ fontSize: "0.7rem", color: theme.textLight }}>{fuel.gPerKm > 0 ? `${fuel.gPerKm}g/km` : "0g/km"}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button style={{ ...s.btnPrimary, opacity: adding ? 0.7 : 1 }} onClick={addVehicle} disabled={adding}>
                {adding ? "Salvataggio…" : "Aggiungi veicolo"}
              </button>
            </div>
          </div>
        )}

        {/* TAB FEEDBACK */}
        {activeTab === "feedback" && (
          <div style={s.section}>
            {loadingF && <p style={{ color: theme.textMuted }}>Caricamento recensioni…</p>}
            {!loadingF && feedbackList.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <p style={{ fontSize: "2rem", margin: "0 0 8px" }}>⭐</p>
                <p style={{ color: theme.textMuted }}>Non hai ancora ricevuto nessuna recensione.</p>
              </div>
            )}
            {feedbackList.length > 0 && (
              <div style={s.avgBox}>
                <div style={s.avgScore}>{Number(votoMedio).toFixed(1)}</div>
                <div>
                  <StarRating value={votoMedio} />
                  <p style={{ margin: "4px 0 0", color: theme.textMuted, fontSize: "0.82rem" }}>
                    {feedbackList.length} {feedbackList.length === 1 ? "recensione" : "recensioni"}
                  </p>
                </div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {feedbackList.map(f => (
                <div key={f.id} style={s.feedbackCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem", color: theme.text }}>{f.autore_nome} {f.autore_cognome}</span>
                      {f.citta_partenza && (
                        <span style={{ fontSize: "0.8rem", color: theme.textMuted }}>
                          &nbsp;· {f.citta_partenza} → {f.citta_arrivo} ({f.data_viaggio})
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#f59e0b", fontSize: "0.95rem", letterSpacing: "1px", whiteSpace: "nowrap" }}>
                      {"★".repeat(f.voto)}{"☆".repeat(5 - f.voto)}
                    </div>
                  </div>
                  {f.commento && <p style={{ margin: 0, color: theme.textMuted, fontSize: "0.88rem", fontStyle: "italic" }}>"{f.commento}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Azioni rapide */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {user.tipo === "autista" && (
            <button style={s.actionBtn} onClick={() => setPage("create")}>🚗 Offri un viaggio</button>
          )}
          <button style={s.actionBtn} onClick={() => setPage("search")}>🔍 Cerca un viaggio</button>
          <button style={s.actionBtn} onClick={() => setPage("feedback")}>⭐ Lascia un feedback</button>
        </div>
      </div>
    </div>
  );
}

function makeStyles(theme) {
  return {
    wrapper: { padding: "32px 16px", display: "flex", justifyContent: "center", background: theme.bg, minHeight: "80vh" },
    container: { width: "100%", maxWidth: "700px" },
    card: { background: theme.surface, borderRadius: "16px", boxShadow: theme.shadowLg, padding: "40px 36px", width: "100%", maxWidth: "400px", margin: "auto" },
    profileHeader: { display: "flex", gap: "20px", alignItems: "flex-start", background: theme.surface, borderRadius: "16px", boxShadow: theme.shadow, padding: "28px", marginBottom: "20px" },
    avatar: { width: "64px", height: "64px", borderRadius: "50%", background: theme.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 700, flexShrink: 0, textTransform: "uppercase" },
    name: { margin: "0 0 4px", fontSize: "1.4rem", fontWeight: 700, color: theme.text },
    meta: { margin: "2px 0", color: theme.textMuted, fontSize: "0.88rem" },
    headerBottom: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "8px" },
    tipoBadge: { display: "inline-block", padding: "4px 14px", borderRadius: "12px", fontSize: "0.82rem", fontWeight: 700 },
    errorBox: { background: theme.error, border: `1px solid ${theme.errorBorder}`, color: theme.errorText, borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "0.88rem" },
    successBox: { background: theme.success, border: `1px solid ${theme.successBorder}`, color: theme.successText, borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "0.88rem" },
    tabs: { display: "flex", gap: "4px", background: theme.tabBg, padding: "4px", borderRadius: "12px", marginBottom: "16px" },
    tab: { flex: 1, padding: "10px 16px", borderRadius: "9px", border: "none", background: "transparent", color: theme.textMuted, fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" },
    tabActive: { background: theme.tabActive, color: theme.text, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
    tabBadge: { background: theme.primary, color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "0.72rem", fontWeight: 700 },
    section: { background: theme.surface, borderRadius: "16px", boxShadow: theme.shadow, padding: "24px", marginBottom: "20px" },
    infoBox: { background: theme.info, border: `1px solid ${theme.infoBorder}`, color: theme.infoText, borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "0.88rem" },
    vehicleList: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" },
    vehicleCard: { display: "flex", justifyContent: "space-between", alignItems: "center", background: theme.surfaceAlt, borderRadius: "10px", padding: "14px 16px", border: `1.5px solid ${theme.border}` },
    vehicleModel: { margin: "0 0 4px", fontWeight: 700, color: theme.text },
    vehicleMeta: { margin: "2px 0", color: theme.textMuted, fontSize: "0.85rem" },
    removeBtn: { padding: "6px 14px", borderRadius: "6px", border: `1px solid ${theme.errorBorder}`, background: theme.error, color: theme.errorText, cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 },
    addForm: { borderTop: `1.5px solid ${theme.border}`, paddingTop: "18px" },
    addTitle: { margin: "0 0 14px", fontSize: "0.92rem", fontWeight: 700, color: theme.text },
    formRow: { display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "14px" },
    formField: { flex: 1, minWidth: "110px" },
    label: { display: "block", marginBottom: "5px", fontWeight: 600, fontSize: "0.8rem", color: theme.textMuted },
    input: { width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1.5px solid ${theme.border}`, fontSize: "0.9rem", outline: "none", boxSizing: "border-box", background: theme.surface, color: theme.text },
    fuelGrid: { display: "flex", gap: "8px", flexWrap: "wrap" },
    fuelOption: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "10px 14px", borderRadius: "10px", border: `1.5px solid ${theme.border}`, background: theme.surfaceAlt, cursor: "pointer", color: theme.text, minWidth: "70px" },
    fuelOptionSelected: { border: `2px solid ${theme.primary}`, background: theme.info, color: theme.infoText },
    btnPrimary: { padding: "10px 24px", borderRadius: "8px", border: "none", background: theme.primary, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" },
    avgBox: { display: "flex", alignItems: "center", gap: "20px", background: theme.warning, border: `1px solid ${theme.warningBorder}`, borderRadius: "12px", padding: "16px 20px", marginBottom: "20px" },
    avgScore: { fontSize: "2.8rem", fontWeight: 800, color: theme.warningText, lineHeight: 1 },
    feedbackCard: { background: theme.surfaceAlt, border: `1px solid ${theme.border}`, borderRadius: "10px", padding: "14px 16px" },
    actionBtn: { padding: "10px 20px", borderRadius: "10px", border: `1.5px solid ${theme.border}`, background: theme.surface, color: theme.text, fontWeight: 600, cursor: "pointer", fontSize: "0.88rem" },
  };
}
