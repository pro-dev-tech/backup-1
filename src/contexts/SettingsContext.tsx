import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserSettings, setUserSettings, getUserProfile, setUserProfile } from "@/lib/firestore";

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
  saveProfile: () => void;
  saveCompany: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const defaultProfile: Profile = { firstName: "", lastName: "", email: "", phone: "" };
const defaultCompany: Company = { name: "", gstin: "", cin: "", state: "", employees: "0" };

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, firebaseUser } = useAuth();

  const [profile, setProfile] = useState<Profile>(() => {
    if (user) return { firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone };
    return defaultProfile;
  });

  const [company, setCompany] = useState<Company>(() => {
    if (user?.company) return user.company;
    return defaultCompany;
  });

  const [accentColor, setAccentColorState] = useState(() => {
    return localStorage.getItem("accent-color") || "220 90% 56%";
  });

  const [showFloatingAI, setShowFloatingAIState] = useState(() => {
    const saved = localStorage.getItem("show-floating-ai");
    return saved !== null ? saved === "true" : true;
  });

  // Sync profile/company from user when auth state changes
  useEffect(() => {
    if (user) {
      setProfile({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone });
      if (user.company) setCompany(user.company);
    }
  }, [user]);

  // Load settings from Firestore
  useEffect(() => {
    if (!firebaseUser) return;
    getUserSettings(firebaseUser.uid).then(settings => {
      if (settings) {
        if (settings.accentColor) {
          setAccentColorState(settings.accentColor);
          applyAccent(settings.accentColor);
        }
        if (settings.showFloatingAI !== undefined) setShowFloatingAIState(settings.showFloatingAI);
      }
    }).catch(() => {});
  }, [firebaseUser]);

  const applyAccent = (hsl: string) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--ring", hsl);
    root.style.setProperty("--sidebar-primary", hsl);
    root.style.setProperty("--sidebar-ring", hsl);
  };

  const setAccentColor = useCallback((hsl: string) => {
    setAccentColorState(hsl);
    localStorage.setItem("accent-color", hsl);
    applyAccent(hsl);
    if (firebaseUser) {
      setUserSettings(firebaseUser.uid, { accentColor: hsl }).catch(() => {});
    }
  }, [firebaseUser]);

  const setShowFloatingAI = useCallback((show: boolean) => {
    setShowFloatingAIState(show);
    localStorage.setItem("show-floating-ai", String(show));
    if (firebaseUser) {
      setUserSettings(firebaseUser.uid, { showFloatingAI: show }).catch(() => {});
    }
  }, [firebaseUser]);

  const saveProfile = useCallback(() => {
    if (firebaseUser) {
      setUserProfile(firebaseUser.uid, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
      }).catch(() => {});
    }
  }, [firebaseUser, profile]);

  const saveCompany = useCallback(() => {
    if (firebaseUser) {
      setUserProfile(firebaseUser.uid, { company }).catch(() => {});
    }
  }, [firebaseUser, company]);

  // Apply saved accent on mount
  useEffect(() => {
    const saved = localStorage.getItem("accent-color");
    if (saved) applyAccent(saved);
  }, []);

  return (
    <SettingsContext.Provider value={{
      profile, setProfile, company, setCompany,
      accentColor, setAccentColor, accentPresets,
      showFloatingAI, setShowFloatingAI,
      saveProfile, saveCompany,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsContext");
  return ctx;
}
