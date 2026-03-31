export default function Navbar({ setPage, user, onLogout }) {
  return (
    <nav style={styles.nav}>
      <div style={styles.brand} onClick={() => setPage("home")}>
        <span style={styles.brandIcon}>🚗</span>
        <span style={styles.brandText}>SmartCity</span>
      </div>

      <div style={styles.links}>
        <button style={styles.link} onClick={() => setPage("search")}>🔍 Cerca</button>
        <button style={styles.link} onClick={() => setPage("dashboard")}>🏠 Home</button>

        {user?.tipo === "autista" && (
          <button style={styles.link} onClick={() => setPage("create")}>➕ Offri</button>
        )}

        {user ? (
          <>
            <button style={styles.link} onClick={() => setPage("feedback")}>⭐ Feedback</button>
            <button style={styles.profileBtn} onClick={() => setPage("profile")}>
              <span style={styles.profileAvatar}>
                {user.nome?.[0]}{user.cognome?.[0]}
              </span>
              <span>{user.nome}</span>
              {user.tipo === "autista" && <span style={styles.autistaDot} title="Autista">🚙</span>}
            </button>
            <button style={styles.logoutBtn} onClick={onLogout}>Esci</button>
          </>
        ) : (
          <>
            <button style={styles.link} onClick={() => setPage("login")}>Accedi</button>
            <button style={styles.registerBtn} onClick={() => setPage("register")}>
              Registrati
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    padding: "0 28px",
    height: "60px",
    background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 12px rgba(37,99,235,0.35)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  brand: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    userSelect: "none",
  },
  brandIcon: {
    fontSize: "1.4rem",
  },
  brandText: {
    fontSize: "1.15rem",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    color: "#fff",
  },
  links: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  link: {
    background: "rgba(255,255,255,0.13)",
    border: "none",
    color: "white",
    padding: "7px 13px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.85rem",
    transition: "background 0.15s",
    backdropFilter: "blur(4px)",
  },
  profileBtn: {
    background: "rgba(255,255,255,0.18)",
    border: "1.5px solid rgba(255,255,255,0.3)",
    color: "white",
    padding: "5px 12px 5px 5px",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.85rem",
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },
  profileAvatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.72rem",
    fontWeight: 800,
    textTransform: "uppercase",
    flexShrink: 0,
    lineHeight: 1,
  },
  autistaDot: {
    fontSize: "0.75rem",
  },
  logoutBtn: {
    background: "rgba(239,68,68,0.85)",
    border: "none",
    color: "white",
    padding: "7px 13px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.85rem",
  },
  registerBtn: {
    background: "white",
    color: "#2563eb",
    border: "none",
    padding: "7px 15px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.85rem",
  },
};
