import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

export default function Login({ onLoginSuccess, setPage }) {
  const { theme } = useTheme();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const login = async () => {
    setError("");
    if (!email || !password) { setError("Inserisci email e password."); return; }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem("user", JSON.stringify(data.user));
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

  const s = makeStyles(theme);

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <div style={s.header}>
          <span style={{ fontSize: "2.4rem" }}>🚗</span>
          <h2 style={s.title}>Accedi</h2>
          <p style={s.subtitle}>Bentornato su Carpooling</p>
        </div>

        {error && <div style={s.errorBox}>{error}</div>}

        <div style={s.field}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" placeholder="nome@esempio.it"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()} autoComplete="email" />
        </div>

        <div style={s.field}>
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()} autoComplete="current-password" />
        </div>

        <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={login} disabled={loading}>
          {loading ? "Accesso in corso…" : "Accedi"}
        </button>

        {setPage && (
          <p style={s.switchText}>
            Non hai un account?{" "}
            <span style={s.link} onClick={() => setPage("register")}>Registrati</span>
          </p>
        )}

        {/* Credenziali di test */}
        <div style={s.testBox}>
          <p style={s.testTitle}>🧪 Account di test</p>
          {[
            ["marco@test.it",    "autista — Fiat Panda (benzina)"],
            ["laura@test.it",    "autista — Toyota Hybrid (ibrido)"],
            ["giovanni@test.it", "autista — Tesla Model 3 (elettrico)"],
            ["sofia@test.it",    "passeggero"],
          ].map(([mail, desc]) => (
            <div key={mail} style={s.testRow} onClick={() => { setEmail(mail); setPassword("password123"); }}>
              <code style={s.testCode}>{mail}</code>
              <span style={s.testDesc}>{desc}</span>
            </div>
          ))}
          <p style={s.testPw}>Password: <code>password123</code> — clicca per compilare</p>
        </div>
      </div>
    </div>
  );
}

function makeStyles(theme) {
  return {
    wrapper: { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: theme.bg },
    card: { background: theme.surface, borderRadius: "16px", boxShadow: theme.shadowLg, padding: "40px 36px", width: "100%", maxWidth: "420px" },
    header: { textAlign: "center", marginBottom: "28px" },
    title: { margin: "8px 0 4px", fontSize: "1.6rem", fontWeight: 700, color: theme.text },
    subtitle: { margin: 0, color: theme.textMuted, fontSize: "0.9rem" },
    errorBox: { background: theme.error, border: `1px solid ${theme.errorBorder}`, color: theme.errorText, borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "0.88rem" },
    field: { marginBottom: "18px" },
    label: { display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "0.85rem", color: theme.textMuted },
    input: { width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1.5px solid ${theme.border}`, fontSize: "0.95rem", outline: "none", boxSizing: "border-box", background: theme.surface, color: theme.text },
    btn: { width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: theme.primary, color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer", marginTop: "8px" },
    switchText: { textAlign: "center", marginTop: "20px", fontSize: "0.88rem", color: theme.textMuted },
    link: { color: theme.primary, fontWeight: 600, cursor: "pointer", textDecoration: "underline" },
    testBox: { marginTop: "24px", padding: "14px 16px", borderRadius: "10px", background: theme.surfaceAlt, border: `1px solid ${theme.border}` },
    testTitle: { margin: "0 0 10px", fontSize: "0.8rem", fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" },
    testRow: { display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", borderRadius: "6px", cursor: "pointer", marginBottom: "4px", transition: "background 0.1s" },
    testCode: { fontSize: "0.78rem", color: theme.primary, fontFamily: "monospace", flexShrink: 0 },
    testDesc: { fontSize: "0.75rem", color: theme.textLight },
    testPw: { margin: "8px 0 0", fontSize: "0.75rem", color: theme.textLight },
  };
}
