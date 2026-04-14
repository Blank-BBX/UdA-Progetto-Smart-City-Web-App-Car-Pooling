import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

export default function ConnectionCheck({ error, onRetry }) {
  const { theme } = useTheme();
  const [busy, setBusy] = useState(false);

  const handleRetry = async () => {
    try { setBusy(true); await onRetry(); }
    finally { setBusy(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "grid", placeItems: "center",
      textAlign: "center", fontFamily: "system-ui, Arial", padding: "24px",
      background: theme.bg, color: theme.text,
    }}>
      <div>
        <h2 style={{ color: theme.text }}>🔴 Errore di connessione</h2>
        <p style={{ maxWidth: 640, margin: "8px auto 16px", color: theme.textMuted }}>
          {error || "Impossibile raggiungere il server su http://localhost:5000"}
        </p>
        <button
          style={{ padding: "10px 20px", borderRadius: 8, fontSize: 16, cursor: "pointer", background: theme.primary, color: "#fff", border: "none", fontWeight: 700 }}
          onClick={handleRetry} disabled={busy}
        >
          {busy ? "Riprovo…" : "Riprova connessione"}
        </button>
        <div style={{ marginTop: 16, fontSize: 14, color: theme.textMuted }}>
          <details>
            <summary style={{ cursor: "pointer" }}>Suggerimenti</summary>
            <ul style={{ textAlign: "left", marginTop: 8 }}>
              <li>Verifica che il backend su <code>localhost:5000</code> sia avviato.</li>
              <li>Controlla l'endpoint <code>/test</code> (deve rispondere <code>{`{ success: true }`}</code>).</li>
              <li>Disabilita temporaneamente estensioni che bloccano richieste (ad es. ad-blocker).</li>
              <li>Verifica CORS sul server se necessario.</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
