// Emissioni CO₂ in g/km per tipo di carburante
// Fonte: dati medi EU per veicoli di categoria M1
export const FUEL_TYPES = {
  benzina:  { label: "Benzina ⛽",     icon: "⛽", gPerKm: 120 },
  diesel:   { label: "Diesel 🛢️",      icon: "🛢️", gPerKm: 110 },
  gpl:      { label: "GPL 🔵",          icon: "🔵", gPerKm: 90  },
  metano:   { label: "Metano 💨",       icon: "💨", gPerKm: 80  },
  ibrido:   { label: "Ibrido 🔋⛽",     icon: "🔋", gPerKm: 60  },
  elettrico:{ label: "Elettrico ⚡",   icon: "⚡", gPerKm: 0   },
};

// Default se il tipo non è specificato
export const DEFAULT_FUEL = "benzina";

/**
 * Calcola CO₂ risparmiata in kg per un passeggero che non usa la propria auto
 * @param {number} km - distanza in km
 * @param {string} fuelType - tipo di carburante del veicolo
 * @returns {string} kg CO₂ con 1 decimale
 */
export function co2Saved(km, fuelType = DEFAULT_FUEL) {
  const gPerKm = FUEL_TYPES[fuelType]?.gPerKm ?? 120;
  return ((km * gPerKm) / 1000).toFixed(1);
}

export const DISTANCES = {
  "milano-roma": 570, "roma-milano": 570,
  "milano-napoli": 770, "napoli-milano": 770,
  "roma-napoli": 220, "napoli-roma": 220,
  "milano-torino": 140, "torino-milano": 140,
  "milano-bologna": 210, "bologna-milano": 210,
  "roma-firenze": 277, "firenze-roma": 277,
  "bologna-firenze": 100, "firenze-bologna": 100,
  "milano-firenze": 300, "firenze-milano": 300,
  "torino-roma": 690, "roma-torino": 690,
  "venezia-milano": 270, "milano-venezia": 270,
  "venezia-roma": 530, "roma-venezia": 530,
  "napoli-palermo": 490, "palermo-napoli": 490,
  "bari-roma": 450, "roma-bari": 450,
  "brescia-milano": 90, "milano-brescia": 90,
  "brescia-roma": 510, "roma-brescia": 510,
  "brescia-venezia": 130, "venezia-brescia": 130,
  "bergamo-milano": 55, "milano-bergamo": 55,
  "verona-milano": 160, "milano-verona": 160,
  "genova-milano": 140, "milano-genova": 140,
};

export function estimateKm(from, to) {
  const key = `${from.toLowerCase().trim()}-${to.toLowerCase().trim()}`;
  return DISTANCES[key] || Math.floor(Math.random() * 300 + 100);
}
