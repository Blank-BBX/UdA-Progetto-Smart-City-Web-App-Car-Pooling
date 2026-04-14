import { useTheme, THEMES } from "../context/ThemeContext";

export default function Navbar({ setPage, user, onLogout }) {
  const { theme, themeKey, cycleTheme } = useTheme();

  const s = {
    nav: {
      padding: "0 28px",
      height: "60px",
      background: theme.navBg,
      color: "white",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: "0 2px 12px rgba(37,99,235,0.35)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    },
    brand: { cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", userSelect: "none" },
    brandIcon: { fontSize: "1.4rem" },
    brandText: { fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.5px", color: "#fff" },
    links: { display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" },
    link: {
      background: "rgba(255,255,255,0.13)",
      border: "none", color: "white",
      padding: "7px 13px", borderRadius: "8px",
      cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
      backdropFilter: "blur(4px)",
    },
    themeBtn: {
      background: "rgba(255,255,255,0.18)",
      border: "1.5px solid rgba(255,255,255,0.3)",
      color: "white",
      padding: "5px 11px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: "0.82rem",
      display: "flex",
      alignItems: "center",
      gap: "5px",
      title: `Tema attuale: ${THEMES[themeKey].name}`,
    },
    profileBtn: {
      background: "rgba(255,255,255,0.18)",
      border: "1.5px solid rgba(255,255,255,0.3)",
      color: "white", padding: "5px 12px 5px 5px",
      borderRadius: "20px", cursor: "pointer",
      fontWeight: 600, fontSize: "0.85rem",
      display: "flex", alignItems: "center", gap: "7px",
    },
    profileAvatar: {
      width: "28px", height: "28px", borderRadius: "50%",
      background: "rgba(255,255,255,0.3)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase",
      flexShrink: 0, lineHeight: 1,
    },
    logoutBtn: {
      background: "rgba(239,68,68,0.85)", border: "none",
      color: "white", padding: "7px 13px", borderRadius: "8px",
      cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
    },
    registerBtn: {
      background: "white", color: theme.primary, border: "none",
      padding: "7px 15px", borderRadius: "8px", cursor: "pointer",
      fontWeight: 700, fontSize: "0.85rem",
    },
  };

  return (
    <nav style={s.nav}>
      <div style={s.brand} onClick={() => setPage("home")}>
        <span style={s.brandIcon}>🚗</span>
        <span style={s.brandText}>SmartCity</span>
      </div>

      <div style={s.links}>
        <button style={s.link} onClick={() => setPage("search")}>🔍 Cerca</button>
        <button style={s.link} onClick={() => setPage("dashboard")}>🏠 Home</button>

        {user?.tipo === "autista" && (
          <button style={s.link} onClick={() => setPage("create")}>➕ Offri</button>
        )}

        {user ? (
          <>
            <button style={s.link} onClick={() => setPage("feedback")}>⭐ Feedback</button>
            <button style={s.profileBtn} onClick={() => setPage("profile")}>
              <span style={s.profileAvatar}>{user.nome?.[0]}{user.cognome?.[0]}</span>
              <span>{user.nome}</span>
              {user.tipo === "autista" && <span style={{ fontSize: "0.75rem" }}>🚙</span>}
            </button>
            <button style={s.logoutBtn} onClick={onLogout}>Esci</button>
          </>
        ) : (
          <>
            <button style={s.link} onClick={() => setPage("login")}>Accedi</button>
            <button style={s.registerBtn} onClick={() => setPage("register")}>Registrati</button>
          </>
        )}

        {/* Theme toggle */}
        <button
          style={s.themeBtn}
          onClick={cycleTheme}
          title={`Tema: ${THEMES[themeKey].name} — clicca per cambiare`}
        >
          {THEMES[themeKey].icon}
        </button>
      </div>
    </nav>
  );
}
