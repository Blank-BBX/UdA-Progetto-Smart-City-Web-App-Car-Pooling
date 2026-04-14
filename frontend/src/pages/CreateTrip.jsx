import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

export default function CreateTrip({ user, setPage }) {
  const { theme } = useTheme();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [trip, setTrip] = useState({
    citta_partenza: "", citta_arrivo: "",
    data_viaggio: "", ora_partenza: "", ora_arrivo: "",
    descrizione: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const nowPlus30 = () => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    return d.toTimeString().slice(0, 5);
  };

  useEffect(() => {
    if (!user || user.tipo !== "autista") return;
    fetch(`http://localhost:5000/api/vehicles?id_utente=${user.id}`)
      .then(r => r.json())
      .then(d => {
        const v = d.vehicles ?? [];
        setVehicles(v);
        if (v.length === 1) setSelectedVehicle(v[0]);
      })
      .catch(() => {});
  }, [user]);

  const update = (field) => (e) => setTrip({ ...trip, [field]: e.target.value });

  const createTrip = async () => {
    setError("");
    if (!trip.citta_partenza || !trip.citta_arrivo || !trip.data_viaggio || !trip.ora_partenza || !trip.ora_arrivo) {
      setError("Compila tutti i campi obbligatori."); return;
    }
    if (!selectedVehicle) { setError("Seleziona un veicolo."); return; }
    const now = new Date();
    const partenza = new Date(`${trip.data_viaggio}T${trip.ora_partenza}`);
    if (partenza <= now) { setError("L'ora di partenza deve essere nel futuro."); return; }
    const arrivo = new Date(`${trip.data_viaggio}T${trip.ora_arrivo}`);
    if (arrivo <= partenza) { setError("L'ora di arrivo deve essere successiva alla partenza."); return; }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...trip,
          id_utente: user.id,
          id_veicolo: selectedVehicle.id,
          posti: selectedVehicle.posti - 1,
        }),
      });
      const data = await res.json();
      if (data.success) { alert("Viaggio pubblicato!"); setPage("dashboard"); }
      else setError(data.message || "Errore nella creazione del viaggio.");
    } catch { setError("Impossibile contattare il server."); }
    finally { setLoading(false); }
  };

  const s = makeStyles(theme);

  if (!user) return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <div style={{ textAlign: "center", fontSize: "3rem", marginBottom: "12px" }}>🚗</div>
        <h3 style={{ textAlign: "center", margin: "0 0 8px", fontSize: "1.3rem", fontWeight: 700, color: theme.text }}>Offri un passaggio</h3>
        <p style={{ textAlign: "center", color: theme.textMuted, marginBottom: "20px" }}>Devi essere loggato per pubblicare un viaggio.</p>
        <button style={s.btnPrimary} onClick={() => setPage("login")}>Vai al Login</button>
        <button style={s.btnSecondary} onClick={() => setPage("register")}>Registrati</button>
      </div>
    </div>
  );

  const isPasseggero = user.tipo !== "autista";

  // Importa FUEL_TYPES inline per mostrare info carburante
  const FUEL_ICONS = { benzina: "⛽", diesel: "🛢️", gpl: "🔵", metano: "💨", ibrido: "🔋", elettrico: "⚡" };

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <h2 style={s.title}>🚗 Offri un passaggio</h2>

        {isPasseggero && (
          <div style={s.passengerBanner}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flex: 1 }}>
              <span style={{ fontSize: "1.6rem" }}>🚙</span>
              <div>
                <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: "0.9rem", color: theme.warningText }}>Sei registrato come passeggero</p>
                <p style={{ margin: 0, fontSize: "0.83rem", color: theme.warningText, opacity: 0.85 }}>Aggiungi un veicolo al profilo per diventare autista.</p>
              </div>
            </div>
            <button style={s.bannerBtn} onClick={() => setPage("profile")}>Aggiungi veicolo →</button>
          </div>
        )}

        {error && <div style={s.errorBox}>{error}</div>}

        <fieldset style={{ border: "none", padding: 0, margin: 0, opacity: isPasseggero ? 0.45 : 1, pointerEvents: isPasseggero ? "none" : "auto" }}>

          {vehicles.length > 0 && (
            <div style={s.field}>
              <label style={s.label}>Veicolo *</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
                {vehicles.map(v => (
                  <div
                    key={v.id}
                    style={{
                      ...s.vehicleOption,
                      ...(selectedVehicle?.id === v.id ? s.vehicleOptionSelected : {}),
                    }}
                    onClick={() => setSelectedVehicle(v)}
                  >
                    <span style={{ fontSize: "1.4rem" }}>{FUEL_ICONS[v.carburante] || "🚘"}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "0.92rem", color: theme.text }}>{v.modello}</p>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: theme.textMuted }}>{v.targa} · {v.posti} posti · {v.carburante}</p>
                    </div>
                    {selectedVehicle?.id === v.id && (
                      <span style={{ color: theme.primary, fontWeight: 700, fontSize: "1rem" }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
              {selectedVehicle && (
                <p style={{ margin: "0 0 4px", fontSize: "0.85rem", color: theme.textMuted }}>
                  💺 Posti passeggeri disponibili: <strong>{selectedVehicle.posti - 1}</strong>
                  <span style={{ color: theme.textLight, fontWeight: 400 }}> (posti totali meno il guidatore)</span>
                </p>
              )}
            </div>
          )}

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Città di partenza *</label>
              <input style={s.input} placeholder="es. Milano" value={trip.citta_partenza} onChange={update("citta_partenza")} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Città di arrivo *</label>
              <input style={s.input} placeholder="es. Roma" value={trip.citta_arrivo} onChange={update("citta_arrivo")} />
            </div>
          </div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Data *</label>
              <input style={s.input} type="date" min={today} value={trip.data_viaggio} onChange={update("data_viaggio")} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Ora partenza *</label>
              <input style={s.input} type="time" min={trip.data_viaggio === today ? nowPlus30() : undefined} value={trip.ora_partenza} onChange={update("ora_partenza")} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Ora arrivo *</label>
              <input style={s.input} type="time" value={trip.ora_arrivo} onChange={update("ora_arrivo")} />
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Descrizione (opzionale)</label>
            <textarea
              style={{ ...s.input, height: "80px", resize: "vertical" }}
              placeholder="Note utili per i passeggeri (soste, bagagli, animali…)"
              value={trip.descrizione} onChange={update("descrizione")}
            />
          </div>
        </fieldset>

        <button
          style={{ ...s.btnPrimary, opacity: (loading || isPasseggero) ? 0.5 : 1, marginTop: "8px" }}
          onClick={createTrip} disabled={loading || isPasseggero}
        >
          {loading ? "Pubblicazione…" : "Pubblica viaggio"}
        </button>
      </div>
    </div>
  );
}

function makeStyles(theme) {
  return {
    wrapper: { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: theme.bg },
    card: { background: theme.surface, borderRadius: "16px", boxShadow: theme.shadowLg, padding: "40px 36px", width: "100%", maxWidth: "580px" },
    title: { marginTop: 0, marginBottom: "20px", fontSize: "1.4rem", fontWeight: 700, color: theme.text },
    passengerBanner: {
      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
      background: theme.warning, border: `1.5px solid ${theme.warningBorder}`, borderRadius: "10px",
      padding: "14px 16px", marginBottom: "20px",
    },
    bannerBtn: { padding: "8px 16px", borderRadius: "8px", border: "none", background: "#f59e0b", color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap" },
    errorBox: { background: theme.error, border: `1px solid ${theme.errorBorder}`, color: theme.errorText, borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "0.88rem" },
    row: { display: "flex", gap: "12px" },
    field: { flex: 1, marginBottom: "16px" },
    label: { display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "0.85rem", color: theme.textMuted },
    input: { width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1.5px solid ${theme.border}`, fontSize: "0.92rem", outline: "none", boxSizing: "border-box", background: theme.surface, color: theme.text },
    vehicleOption: {
      display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px",
      border: `1.5px solid ${theme.border}`, cursor: "pointer", background: theme.surfaceAlt, position: "relative",
    },
    vehicleOptionSelected: { border: `2px solid ${theme.primary}`, background: theme.info },
    btnPrimary: { width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: theme.primary, color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer" },
    btnSecondary: { width: "100%", padding: "12px", borderRadius: "8px", border: `1.5px solid ${theme.border}`, background: theme.surface, color: theme.text, fontWeight: 600, fontSize: "1rem", cursor: "pointer", marginTop: "10px" },
  };
}
