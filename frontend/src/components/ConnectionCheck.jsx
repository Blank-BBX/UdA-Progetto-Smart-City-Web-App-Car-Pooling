import { useState } from "react";

export default function ConnectionCheck({ error, onRetry }) {
  const [busy, setBusy] = useState(false);

  const handleRetry = async () => {
    try {
      setBusy(true);
      await onRetry();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>🔴 Errore di connessione</h2>
      <p style={styles.msg}>
        {error || "Impossibile raggiungere il server su http://localhost:5000"}
      </p>
      <button style={styles.button} onClick={handleRetry} disabled={busy}>
        {busy ? "Riprovo…" : "Riprova connessione"}
      </button>
      <div style={styles.help}>
        <details>
          <summary>Suggerimenti</summary>
          <ul>
            <li>Verifica che il backend su <code>localhost:5000</code> sia avviato.</li>
            <li>Controlla l’endpoint <code>/test</code> (deve rispondere <code>{`{ success: true }`}</code>).</li>
            <li>Disabilita temporaneamente estensioni che bloccano richieste (ad es. ad-blocker).</li>
            <li>Verifica CORS sul server se necessario.</li>
          </ul>
        </details>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    fontFamily: "system-ui, Arial",
    padding: "24px",
  },
  msg: { maxWidth: 640, margin: "8px auto 16px" },
  button: {
    padding: "10px 20px",
    borderRadius: 8,
    fontSize: 16,
    cursor: "pointer",
  },
  help: { marginTop: 16, fontSize: 14, color: "#555" },
};