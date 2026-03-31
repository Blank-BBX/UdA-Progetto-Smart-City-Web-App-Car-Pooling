import { useState } from "react";

const emptyForm = { nome: "", cognome: "", email: "", password: "", confermaPassword: "", telefono: "" };

export default function Register({ setPage }) {
  const [form, setForm]       = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    if (!form.nome.trim())    return "Il nome è obbligatorio.";
    if (!form.cognome.trim()) return "Il cognome è obbligatorio.";
    if (!form.email.trim())   return "L'email è obbligatoria.";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Email non valida.";
    if (form.password.length < 6) return "La password deve avere almeno 6 caratteri.";
    if (form.password !== form.confermaPassword) return "Le password non coincidono.";
    return null;
  };

  const register = async () => {
    setError(""); setSuccess("");
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome:     form.nome.trim(),
          cognome:  form.cognome.trim(),
          email:    form.email.trim().toLowerCase(),
          password: form.password,
          telefono: form.telefono.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Registrazione completata! Ora puoi accedere.");
        setForm(emptyForm);
        setTimeout(() => { if (setPage) setPage("login"); }, 1500);
      } else {
        setError(data.message || "Errore durante la registrazione.");
      }
    } catch {
      setError("Impossibile contattare il server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.icon}>🚗</span>
          <h2 style={styles.title}>Registrazione</h2>
          <p style={styles.subtitle}>Crea il tuo account — puoi offrire e prenotare viaggi</p>
        </div>

        {error   && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Nome *</label>
            <input style={styles.input} placeholder="Mario" value={form.nome} onChange={update("nome")} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Cognome *</label>
            <input style={styles.input} placeholder="Rossi" value={form.cognome} onChange={update("cognome")} />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Email *</label>
          <input style={styles.input} type="email" placeholder="mario@esempio.it" value={form.email} onChange={update("email")} autoComplete="email" />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Telefono</label>
          <input style={styles.input} type="tel" placeholder="+39 333 1234567" value={form.telefono} onChange={update("telefono")} />
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Password *</label>
            <input style={styles.input} type="password" placeholder="••••••••" value={form.password} onChange={update("password")} autoComplete="new-password" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Conferma *</label>
            <input style={styles.input} type="password" placeholder="••••••••" value={form.confermaPassword} onChange={update("confermaPassword")} />
          </div>
        </div>

        <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} onClick={register} disabled={loading}>
          {loading ? "Registrazione in corso…" : "Registrati"}
        </button>

        {setPage && (
          <p style={styles.switchText}>
            Hai già un account?{" "}
            <span style={styles.link} onClick={() => setPage("login")}>Accedi</span>
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper:    { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
  card:       { background: "#fff", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", padding: "40px 36px", width: "100%", maxWidth: "480px" },
  header:     { textAlign: "center", marginBottom: "24px" },
  icon:       { fontSize: "2.4rem" },
  title:      { margin: "8px 0 4px", fontSize: "1.6rem", fontWeight: 700, color: "#1a1a2e" },
  subtitle:   { margin: 0, color: "#666", fontSize: "0.85rem" },
  errorBox:   { background: "#fff0f0", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "0.88rem" },
  successBox: { background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "0.88rem" },
  row:        { display: "flex", gap: "12px" },
  field:      { flex: 1, marginBottom: "16px" },
  label:      { display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "0.85rem", color: "#374151" },
  input:      { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #d1d5db", fontSize: "0.92rem", outline: "none", boxSizing: "border-box" },
  btn:        { width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer", marginTop: "4px" },
  switchText: { textAlign: "center", marginTop: "20px", fontSize: "0.88rem", color: "#555" },
  link:       { color: "#2563eb", fontWeight: 600, cursor: "pointer", textDecoration: "underline" },
};
