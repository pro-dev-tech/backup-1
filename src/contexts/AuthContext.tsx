import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getUserProfile, setUserProfile,
  getManagedUsers, addManagedUser as fsAddManagedUser,
  deleteManagedUser as fsDeleteManagedUser,
  toggleManagedUser as fsToggleManagedUser,
} from "@/lib/firestore";
import type { User, UserRole, ManagedUser, RolePermissions } from "@/backend/types";
import { ROLE_PERMISSIONS } from "@/backend/types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  role: UserRole;
  permissions: RolePermissions;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  managedUsers: ManagedUser[];
  addManagedUser: (user: Omit<ManagedUser, "id" | "createdAt" | "active">) => void;
  removeManagedUser: (id: string) => void;
  toggleManagedUser: (id: string) => void;
  hasPermission: (key: keyof RolePermissions) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const role = user?.role || "finance";
  const permissions = ROLE_PERMISSIONS[role];

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Fetch profile from Firestore
        const profile = await getUserProfile(fbUser.uid);
        if (profile) {
          setUser(profile as User);
        } else {
          // Minimal user from Firebase Auth
          setUser({
            id: fbUser.uid,
            firstName: fbUser.displayName?.split(" ")[0] || "User",
            lastName: fbUser.displayName?.split(" ").slice(1).join(" ") || "",
            email: fbUser.email || "",
            phone: fbUser.phoneNumber || "",
            company: { name: "", gstin: "", cin: "", state: "", employees: "0" },
            role: "admin",
            createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
          });
        }
        // Load managed users
        try {
          const mu = await getManagedUsers(fbUser.uid);
          setManagedUsers(mu as ManagedUser[]);
        } catch { }
      } else {
        setUser(null);
        setManagedUsers([]);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = useCallback(async (email: string, password: string, loginRole: UserRole): Promise<boolean> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Update role in Firestore
      await setUserProfile(cred.user.uid, { role: loginRole });
      // Fetch full profile
      const profile = await getUserProfile(cred.user.uid);
      if (profile) {
        setUser({ ...(profile as User), role: loginRole });
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const register = useCallback(async (data: any): Promise<boolean> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const newUser: User = {
        id: cred.user.uid,
        firstName: data.firstName || data.email.split("@")[0],
        lastName: data.lastName || "",
        email: data.email,
        phone: data.phone || "",
        company: {
          name: data.companyName || "",
          gstin: data.gstin || "",
          cin: "",
          state: data.stateOfRegistration || "",
          employees: data.employeeCount || "0",
          businessType: data.businessType || "",
          industryType: data.industryType || "",
          pan: data.pan || "",
          annualTurnover: data.annualTurnover || "",
        },
        role: "admin",
        createdAt: new Date().toISOString(),
      };
      await setUserProfile(cred.user.uid, newUser);
      setUser(newUser);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    signOut(auth);
    setUser(null);
    setManagedUsers([]);
  }, []);

  const addManagedUserHandler = useCallback(async (userData: Omit<ManagedUser, "id" | "createdAt" | "active">) => {
    if (!firebaseUser) return;
    const result = await fsAddManagedUser(firebaseUser.uid, userData);
    setManagedUsers(prev => [...prev, result as ManagedUser]);
  }, [firebaseUser]);

  const removeManagedUserHandler = useCallback(async (id: string) => {
    if (!firebaseUser) return;
    await fsDeleteManagedUser(firebaseUser.uid, id);
    setManagedUsers(prev => prev.filter(u => u.id !== id));
  }, [firebaseUser]);

  const toggleManagedUserHandler = useCallback(async (id: string) => {
    if (!firebaseUser) return;
    const user = managedUsers.find(u => u.id === id);
    if (!user) return;
    await fsToggleManagedUser(firebaseUser.uid, id, user.active);
    setManagedUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  }, [firebaseUser, managedUsers]);

  const hasPermission = useCallback((key: keyof RolePermissions) => {
    return permissions[key];
  }, [permissions]);

  return (
    <AuthContext.Provider value={{
      user, firebaseUser, role, permissions, isAuthenticated: !!user, loading,
      login, register, logout,
      managedUsers,
      addManagedUser: addManagedUserHandler,
      removeManagedUser: removeManagedUserHandler,
      toggleManagedUser: toggleManagedUserHandler,
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
