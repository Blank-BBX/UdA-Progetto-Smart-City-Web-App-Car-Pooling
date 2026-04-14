import { createContext, useContext, useState, useEffect } from "react";

export const THEMES = {
  light: {
    name: "Chiaro",
    icon: "☀️",
    bg: "#f0f4ff",
    surface: "#ffffff",
    surfaceAlt: "#f9fafb",
    border: "#e5e7eb",
    borderFocus: "#2563eb",
    text: "#1a1a2e",
    textMuted: "#6b7280",
    textLight: "#9ca3af",
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    primaryText: "#ffffff",
    navBg: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)",
    heroBg: "linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)",
    shadow: "0 2px 16px rgba(0,0,0,0.08)",
    shadowLg: "0 4px 24px rgba(0,0,0,0.10)",
    success: "#f0fdf4",
    successBorder: "#86efac",
    successText: "#166534",
    error: "#fff0f0",
    errorBorder: "#fca5a5",
    errorText: "#b91c1c",
    warning: "#fffbeb",
    warningBorder: "#fcd34d",
    warningText: "#92400e",
    info: "#eff6ff",
    infoBorder: "#bfdbfe",
    infoText: "#1e40af",
    tabBg: "#f3f4f6",
    tabActive: "#ffffff",
    cardPastBg: "#f9fafb",
    driverBadgeBg: "#dcfce7",
    driverBadgeColor: "#166534",
    passengerBadgeBg: "#dbeafe",
    passengerBadgeColor: "#1e40af",
  },
  dark: {
    name: "Scuro",
    icon: "🌙",
    bg: "#0f172a",
    surface: "#1e293b",
    surfaceAlt: "#1a2744",
    border: "#334155",
    borderFocus: "#60a5fa",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    textLight: "#64748b",
    primary: "#3b82f6",
    primaryHover: "#2563eb",
    primaryText: "#ffffff",
    navBg: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e3a5f 100%)",
    heroBg: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1e40af 100%)",
    shadow: "0 2px 16px rgba(0,0,0,0.4)",
    shadowLg: "0 4px 24px rgba(0,0,0,0.5)",
    success: "#052e16",
    successBorder: "#166534",
    successText: "#86efac",
    error: "#450a0a",
    errorBorder: "#991b1b",
    errorText: "#fca5a5",
    warning: "#451a03",
    warningBorder: "#92400e",
    warningText: "#fde68a",
    info: "#0c1a3b",
    infoBorder: "#1e40af",
    infoText: "#93c5fd",
    tabBg: "#0f172a",
    tabActive: "#1e293b",
    cardPastBg: "#1a2233",
    driverBadgeBg: "#052e16",
    driverBadgeColor: "#86efac",
    passengerBadgeBg: "#0c1a3b",
    passengerBadgeColor: "#93c5fd",
  },
  green: {
    name: "Eco",
    icon: "🌿",
    bg: "#f0fdf4",
    surface: "#ffffff",
    surfaceAlt: "#f0fdf4",
    border: "#bbf7d0",
    borderFocus: "#16a34a",
    text: "#14532d",
    textMuted: "#4d7c0f",
    textLight: "#86efac",
    primary: "#16a34a",
    primaryHover: "#15803d",
    primaryText: "#ffffff",
    navBg: "linear-gradient(135deg, #14532d 0%, #16a34a 60%, #22c55e 100%)",
    heroBg: "linear-gradient(135deg, #14532d 0%, #166534 60%, #16a34a 100%)",
    shadow: "0 2px 16px rgba(22,101,52,0.10)",
    shadowLg: "0 4px 24px rgba(22,101,52,0.13)",
    success: "#dcfce7",
    successBorder: "#86efac",
    successText: "#14532d",
    error: "#fff0f0",
    errorBorder: "#fca5a5",
    errorText: "#b91c1c",
    warning: "#fffbeb",
    warningBorder: "#fcd34d",
    warningText: "#92400e",
    info: "#f0fdf4",
    infoBorder: "#86efac",
    infoText: "#14532d",
    tabBg: "#dcfce7",
    tabActive: "#ffffff",
    cardPastBg: "#f0fdf4",
    driverBadgeBg: "#dcfce7",
    driverBadgeColor: "#14532d",
    passengerBadgeBg: "#d1fae5",
    passengerBadgeColor: "#065f46",
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(() => {
    return localStorage.getItem("smartcity_theme") || "light";
  });

  const theme = THEMES[themeKey] || THEMES.light;

  const cycleTheme = () => {
    const keys = Object.keys(THEMES);
    const next = keys[(keys.indexOf(themeKey) + 1) % keys.length];
    setThemeKey(next);
    localStorage.setItem("smartcity_theme", next);
  };

  useEffect(() => {
    document.body.style.background = theme.bg;
    document.body.style.color = theme.text;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeKey, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
