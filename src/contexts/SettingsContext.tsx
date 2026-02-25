import { createContext, useContext, useState, useCallback } from "react";

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Company {
  name: string;
  gstin: string;
  cin: string;
  state: string;
  employees: string;
}

interface AccentColor {
  hsl: string;
  label: string;
}

const accentPresets: AccentColor[] = [
  { hsl: "220 90% 56%", label: "Blue" },
  { hsl: "250 80% 62%", label: "Purple" },
  { hsl: "142 71% 45%", label: "Green" },
  { hsl: "38 92% 50%", label: "Orange" },
  { hsl: "0 72% 51%", label: "Red" },
];

interface SettingsContextType {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  company: Company;
  setCompany: React.Dispatch<React.SetStateAction<Company>>;
  accentColor: string;
  setAccentColor: (hsl: string) => void;
  accentPresets: AccentColor[];
  showFloatingAI: boolean;
  setShowFloatingAI: (show: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>({
    firstName: "Rahul",
    lastName: "Agarwal",
    email: "rahul@acmepvt.com",
    phone: "+91 98765 43210",
  });

  const [company, setCompany] = useState<Company>({
    name: "Acme Pvt Ltd",
    gstin: "27AABCU9603R1ZX",
    cin: "U72200MH2020PTC123456",
    state: "Maharashtra",
    employees: "35",
  });

  const [accentColor, setAccentColorState] = useState(() => {
    return localStorage.getItem("accent-color") || "220 90% 56%";
  });

  const [showFloatingAI, setShowFloatingAIState] = useState(() => {
    const saved = localStorage.getItem("show-floating-ai");
    return saved !== null ? saved === "true" : true; // default enabled
  });

  const setAccentColor = useCallback((hsl: string) => {
    setAccentColorState(hsl);
    localStorage.setItem("accent-color", hsl);
    const root = document.documentElement;
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--ring", hsl);
    root.style.setProperty("--sidebar-primary", hsl);
    root.style.setProperty("--sidebar-ring", hsl);
  }, []);

  const setShowFloatingAI = useCallback((show: boolean) => {
    setShowFloatingAIState(show);
    localStorage.setItem("show-floating-ai", String(show));
  }, []);

  // Apply saved accent on mount
  useState(() => {
    const saved = localStorage.getItem("accent-color");
    if (saved) {
      const root = document.documentElement;
      root.style.setProperty("--primary", saved);
      root.style.setProperty("--ring", saved);
      root.style.setProperty("--sidebar-primary", saved);
      root.style.setProperty("--sidebar-ring", saved);
    }
  });

  return (
    <SettingsContext.Provider value={{ profile, setProfile, company, setCompany, accentColor, setAccentColor, accentPresets, showFloatingAI, setShowFloatingAI }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
