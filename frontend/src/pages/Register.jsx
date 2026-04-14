import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

const emptyForm = { nome: "", cognome: "", email: "", password: "", confermaPassword: "", telefono: "" };

export default function Register({ setPage }) {
  const { theme } = useTheme();
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

  const s = makeStyles(theme);

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <div style={s.header}>
          <span style={{ fontSize: "2.4rem" }}>🚗</span>
          <h2 style={s.title}>Registrazione</h2>
          <p style={s.subtitle}>Crea il tuo account — puoi offrire e prenotare viaggi</p>
        </div>

        {error   && <div style={s.errorBox}>{error}</div>}
        {success && <div style={s.successBox}>{success}</div>}

        <div style={s.row}>
          <div style={s.field}>
            <label style={s.label}>Nome *</label>
            <input style={s.input} placeholder="Mario" value={form.nome} onChange={update("nome")} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Cognome *</label>
            <input style={s.input} placeholder="Rossi" value={form.cognome} onChange={update("cognome")} />
          </div>
        </div>

        <div style={s.field}>
          <label style={s.label}>Email *</label>
          <input style={s.input} type="email" placeholder="mario@esempio.it" value={form.email} onChange={update("email")} autoComplete="email" />
        </div>

        <div style={s.field}>
          <label style={s.label}>Telefono</label>
          <input style={s.input} type="tel" placeholder="+39 333 1234567" value={form.telefono} onChange={update("telefono")} />
        </div>

        <div style={s.row}>
          <div style={s.field}>
            <label style={s.label}>Password *</label>
            <input style={s.input} type="password" placeholder="••••••••" value={form.password} onChange={update("password")} autoComplete="new-password" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Conferma *</label>
            <input style={s.input} type="password" placeholder="••••••••" value={form.confermaPassword} onChange={update("confermaPassword")} />
          </div>
        </div>

        <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={register} disabled={loading}>
          {loading ? "Registrazione in corso…" : "Registrati"}
        </button>

        {setPage && (
          <p style={s.switchText}>
            Hai già un account?{" "}
            <span style={s.link} onClick={() => setPage("login")}>Accedi</span>
          </p>
        )}
      </div>
    </div>
  );
}

function makeStyles(theme) {
  return {
    wrapper:    { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: theme.bg },
    card:       { background: theme.surface, borderRadius: "16px", boxShadow: theme.shadowLg, padding: "40px 36px", width: "100%", maxWidth: "480px" },
    header:     { textAlign: "center", marginBottom: "24px" },
    title:      { margin: "8px 0 4px", fontSize: "1.6rem", fontWeight: 700, color: theme.text },
    subtitle:   { margin: 0, color: theme.textMuted, fontSize: "0.85rem" },
    errorBox:   { background: theme.error,   border: `1px solid ${theme.errorBorder}`,   color: theme.errorText,   borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "0.88rem" },
    successBox: { background: theme.success, border: `1px solid ${theme.successBorder}`, color: theme.successText, borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "0.88rem" },
    row:        { display: "flex", gap: "12px" },
    field:      { flex: 1, marginBottom: "16px" },
    label:      { display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "0.85rem", color: theme.textMuted },
    input:      { width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1.5px solid ${theme.border}`, fontSize: "0.92rem", outline: "none", boxSizing: "border-box", background: theme.surface, color: theme.text },
    btn:        { width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: theme.primary, color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer", marginTop: "4px" },
    switchText: { textAlign: "center", marginTop: "20px", fontSize: "0.88rem", color: theme.textMuted },
    link:       { color: theme.primary, fontWeight: 600, cursor: "pointer", textDecoration: "underline" },
  };
}
