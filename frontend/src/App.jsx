// src/App.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import CreateTrip from "./pages/CreateTrip";
import SearchTrip from "./pages/SearchTrip";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feedback from "./pages/Feedback";
import Profile from "./pages/Profile";
import ConnectionCheck from "./components/ConnectionCheck";

function AppInner() {
  const { theme } = useTheme();
  const [connState, setConnState] = useState("checking");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedPage, setSelectedPage] = useState("dashboard");

  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    sessionStorage.setItem("user", JSON.stringify(userData));
    setSelectedPage("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem("user");
    setSelectedPage("dashboard");
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const doPing = useCallback(async () => {
    try {
      setConnState("checking");
      setErrorMsg("");
      const res = await fetch("http://localhost:5000/test", { method: "GET" });
      const isJson = res.headers.get("content-type")?.includes("application/json");
      const data = isJson ? await res.json() : null;
      if (res.ok && data?.success) {
        setConnState("ok");
      } else {
        setErrorMsg(`Risposta non valida dal server: ${data?.message || `Status ${res.status}`}`);
        setConnState("error");
      }
    } catch (err) {
      setErrorMsg(`Errore di rete: ${err?.message || "imprevisto"}`);
      setConnState("error");
    }
  }, []);

  useEffect(() => { doPing(); }, [doPing]);

  const CurrentPage = useMemo(() => {
    switch (selectedPage) {
      case "home":
      case "dashboard": return <Dashboard user={user} setPage={setSelectedPage} />;
      case "search":    return <SearchTrip user={user} setPage={setSelectedPage} />;
      case "create":    return <CreateTrip user={user} setPage={setSelectedPage} />;
      case "login":     return <Login onLoginSuccess={handleLoginSuccess} setPage={setSelectedPage} />;
      case "register":  return <Register setPage={setSelectedPage} />;
      case "feedback":  return <Feedback user={user} setPage={setSelectedPage} />;
      case "profile":   return <Profile user={user} setUser={handleUserUpdate} setPage={setSelectedPage} />;
      default:          return <Dashboard user={user} setPage={setSelectedPage} />;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPage, user]);

  if (connState === "checking") {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui, Arial", background: theme.bg, color: theme.text }}>
        <h2>🔍 Verifica connessione al server…</h2>
      </div>
    );
  }

  if (connState === "error") {
    return <ConnectionCheck error={errorMsg} onRetry={doPing} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: theme.bg }}>
      <Navbar setPage={setSelectedPage} user={user} onLogout={handleLogout} />
      <main style={{ flex: 1, padding: "16px", overflow: "auto" }}>{CurrentPage}</main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
