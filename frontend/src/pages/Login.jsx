import { useState } from "react";

export default function Login({ onLoginSuccess, setPage }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const login = async () => {
    setError("");

    if (!email || !password) {
      setError("Inserisci email e password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.success) {
        // Salva l'utente in sessionStorage per averlo disponibile nell'app
        sessionStorage.setItem("user", JSON.stringify(data.user));
        // Chiama il callback opzionale del genitore (App.jsx può passarlo)
        if (onLoginSuccess) onLoginSuccess(data.user);
        alert(`Benvenuto, ${data.user.nome}!`);
        if (setPage) setPage("dashboard");
      } else {
        setError(data.message || "Credenziali non valide.");
      }
    } catch {
      setError("Impossibile contattare il server. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") login();
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.icon}>🚗</span>
          <h2 style={styles.title}>Accedi</h2>
          <p style={styles.subtitle}>Bentornato su Carpooling</p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="nome@esempio.it"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="email"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="current-password"
          />
        </div>

        <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} onClick={login} disabled={loading}>
          {loading ? "Accesso in corso…" : "Accedi"}
        </button>

        {setPage && (
          <p style={styles.switchText}>
            Non hai un account?{" "}
            <span style={styles.link} onClick={() => setPage("register")}>
              Registrati
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "80vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "400px",
  },
  header: {
    textAlign: "center",
    marginBottom: "28px",
  },
  icon: {
    fontSize: "2.4rem",
  },
  title: {
    margin: "8px 0 4px",
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "#1a1a2e",
  },
  subtitle: {
    margin: 0,
    color: "#666",
    fontSize: "0.9rem",
  },
  errorBox: {
    background: "#fff0f0",
    border: "1px solid #fca5a5",
    color: "#b91c1c",
    borderRadius: "8px",
    padding: "10px 14px",
    marginBottom: "16px",
    fontSize: "0.88rem",
  },
  field: {
    marginBottom: "18px",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: 600,
    fontSize: "0.85rem",
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1.5px solid #d1d5db",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  btn: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
    marginTop: "8px",
    transition: "background 0.2s",
  },
  switchText: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "0.88rem",
    color: "#555",
  },
  link: {
    color: "#2563eb",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "underline",
  },
};
