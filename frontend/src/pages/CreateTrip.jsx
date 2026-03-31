import { useState, useEffect } from "react";

export default function CreateTrip({ user, setPage }) {
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
    if (!selectedVehicle) {
      setError("Seleziona un veicolo."); return;
    }
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
          posti: selectedVehicle.posti - 1, // posti passeggeri = posti totali - 1 (il guidatore)
        }),
      });
      const data = await res.json();
      if (data.success) { alert("Viaggio pubblicato!"); setPage("dashboard"); }
      else setError(data.message || "Errore nella creazione del viaggio.");
    } catch { setError("Impossibile contattare il server."); }
    finally { setLoading(false); }
  };

  if (!user) return (
    <div style={styles.wrapper}><div style={styles.card}>
      <div style={styles.gateIcon}>🚗</div>
      <h3 style={styles.gateTitle}>Offri un passaggio</h3>
      <p style={styles.gateText}>Devi essere loggato per pubblicare un viaggio.</p>
      <button style={styles.btnPrimary} onClick={() => setPage("login")}>Vai al Login</button>
      <button style={styles.btnSecondary} onClick={() => setPage("register")}>Registrati</button>
    </div></div>
  );

  const isPasseggero = user.tipo !== "autista";

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>🚗 Offri un passaggio</h2>

        {isPasseggero && (
          <div style={styles.passengerBanner}>
            <div style={styles.bannerLeft}>
              <span style={styles.bannerIcon}>🚙</span>
              <div>
                <p style={styles.bannerTitle}>Sei registrato come passeggero</p>
                <p style={styles.bannerText}>Aggiungi un veicolo al profilo per diventare autista.</p>
              </div>
            </div>
            <button style={styles.bannerBtn} onClick={() => setPage("profile")}>Aggiungi veicolo →</button>
          </div>
        )}

        {error && <div style={styles.errorBox}>{error}</div>}

        <fieldset style={{ border: "none", padding: 0, margin: 0, opacity: isPasseggero ? 0.45 : 1, pointerEvents: isPasseggero ? "none" : "auto" }}>

          {/* Selezione veicolo */}
          {vehicles.length > 0 && (
            <div style={styles.field}>
              <label style={styles.label}>Veicolo *</label>
              <div style={styles.vehicleGrid}>
                {vehicles.map(v => (
                  <div
                    key={v.id}
                    style={{
                      ...styles.vehicleOption,
                      ...(selectedVehicle?.id === v.id ? styles.vehicleOptionSelected : {}),
                    }}
                    onClick={() => setSelectedVehicle(v)}
                  >
                    <span style={styles.vehicleOptionIcon}>🚘</span>
                    <div>
                      <p style={styles.vehicleOptionModel}>{v.modello}</p>
                      <p style={styles.vehicleOptionMeta}>{v.targa} · {v.posti} posti tot.</p>
                    </div>
                    {selectedVehicle?.id === v.id && <span style={styles.checkmark}>✓</span>}
                  </div>
                ))}
              </div>
              {selectedVehicle && (
                <p style={styles.postiInfo}>
                  💺 Posti passeggeri disponibili: <strong>{selectedVehicle.posti - 1}</strong>
                  <span style={styles.postiHint}> (posti totali meno il guidatore)</span>
                </p>
              )}
            </div>
          )}

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Città di partenza *</label>
              <input style={styles.input} placeholder="es. Milano" value={trip.citta_partenza} onChange={update("citta_partenza")} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Città di arrivo *</label>
              <input style={styles.input} placeholder="es. Roma" value={trip.citta_arrivo} onChange={update("citta_arrivo")} />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Data *</label>
              <input style={styles.input} type="date" min={today} value={trip.data_viaggio} onChange={update("data_viaggio")} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Ora partenza *</label>
              <input style={styles.input} type="time" min={trip.data_viaggio === today ? nowPlus30() : undefined} value={trip.ora_partenza} onChange={update("ora_partenza")} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Ora arrivo *</label>
              <input style={styles.input} type="time" value={trip.ora_arrivo} onChange={update("ora_arrivo")} />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Descrizione (opzionale)</label>
            <textarea
              style={{ ...styles.input, height: "80px", resize: "vertical" }}
              placeholder="Note utili per i passeggeri (soste, bagagli, animali…)"
              value={trip.descrizione} onChange={update("descrizione")}
            />
          </div>
        </fieldset>

        <button
          style={{ ...styles.btnPrimary, opacity: (loading || isPasseggero) ? 0.5 : 1, marginTop: "8px" }}
          onClick={createTrip} disabled={loading || isPasseggero}
        >
          {loading ? "Pubblicazione…" : "Pubblica viaggio"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
  card: { background: "#fff", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", padding: "40px 36px", width: "100%", maxWidth: "580px" },
  title: { marginTop: 0, marginBottom: "20px", fontSize: "1.4rem", fontWeight: 700, color: "#1a1a2e" },
  passengerBanner: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: "10px", padding: "14px 16px", marginBottom: "20px" },
  bannerLeft: { display: "flex", gap: "12px", alignItems: "flex-start", flex: 1 },
  bannerIcon: { fontSize: "1.6rem" },
  bannerTitle: { margin: "0 0 3px", fontWeight: 700, fontSize: "0.9rem", color: "#92400e" },
  bannerText: { margin: 0, fontSize: "0.83rem", color: "#78350f" },
  bannerBtn: { padding: "8px 16px", borderRadius: "8px", border: "none", background: "#f59e0b", color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap" },
  errorBox: { background: "#fff0f0", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "0.88rem" },
  row: { display: "flex", gap: "12px" },
  field: { flex: 1, marginBottom: "16px" },
  label: { display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "0.85rem", color: "#374151" },
  input: { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #d1d5db", fontSize: "0.92rem", outline: "none", boxSizing: "border-box" },
  vehicleGrid: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" },
  vehicleOption: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", cursor: "pointer", background: "#f9fafb", position: "relative", transition: "all 0.15s" },
  vehicleOptionSelected: { border: "2px solid #2563eb", background: "#eff6ff" },
  vehicleOptionIcon: { fontSize: "1.4rem" },
  vehicleOptionModel: { margin: "0 0 2px", fontWeight: 700, fontSize: "0.92rem", color: "#1a1a2e" },
  vehicleOptionMeta: { margin: 0, fontSize: "0.8rem", color: "#6b7280" },
  checkmark: { position: "absolute", right: "14px", color: "#2563eb", fontWeight: 700, fontSize: "1rem" },
  postiInfo: { margin: "0 0 4px", fontSize: "0.85rem", color: "#374151" },
  postiHint: { color: "#9ca3af", fontWeight: 400 },
  btnPrimary: { width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer" },
  btnSecondary: { width: "100%", padding: "12px", borderRadius: "8px", border: "1.5px solid #d1d5db", background: "#fff", color: "#374151", fontWeight: 600, fontSize: "1rem", cursor: "pointer", marginTop: "10px" },
  gateIcon: { textAlign: "center", fontSize: "3rem", marginBottom: "12px" },
  gateTitle: { textAlign: "center", margin: "0 0 8px", fontSize: "1.3rem", fontWeight: 700, color: "#1a1a2e" },
  gateText: { textAlign: "center", color: "#555", marginBottom: "20px" },
};
