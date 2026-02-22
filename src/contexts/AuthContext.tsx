import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, UserRole, ManagedUser, RolePermissions } from "@/backend/types";
import { ROLE_PERMISSIONS } from "@/backend/types";
import { api, setToken, clearToken } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  permissions: RolePermissions;
  isAuthenticated: boolean;
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

const DEMO_ADMIN: User = {
  id: "usr-001",
  firstName: "Admin",
  lastName: "Name",
  email: "rahul@acmepvt.com",
  phone: "+91 98765 43210",
  company: {
    name: "Acme Pvt Ltd",
    gstin: "27AABCU9603R1ZX",
    cin: "U72200MH2020PTC123456",
    state: "Maharashtra",
    employees: "35",
  },
  role: "admin",
  createdAt: "2025-06-15T10:00:00Z",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("cai_auth_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>(() => {
    const saved = localStorage.getItem("cai_managed_users");
    return saved ? JSON.parse(saved) : [];
  });

  const role = user?.role || "finance";
  const permissions = ROLE_PERMISSIONS[role];

  useEffect(() => {
    if (user) localStorage.setItem("cai_auth_user", JSON.stringify(user));
    else localStorage.removeItem("cai_auth_user");
  }, [user]);

  useEffect(() => {
    localStorage.setItem("cai_managed_users", JSON.stringify(managedUsers));
  }, [managedUsers]);

  // Try backend auth first, fallback to demo mode
  const login = useCallback(async (email: string, _password: string, loginRole: UserRole): Promise<boolean> => {
    try {
      const res = await api.post<{ user: User; token: string }>("/auth/login", {
        email,
        password: _password,
        role: loginRole,
      });
      if (res.success && res.data) {
        const userData = { ...res.data.user, role: loginRole };
        setUser(userData);
        setToken(res.data.token);
        return true;
      }
    } catch {
      // Backend unavailable – fall back to demo mode
      console.info("Backend unavailable, using demo auth");
    }

    // Demo fallback (works without backend)
    if (loginRole === "admin") {
      setUser({ ...DEMO_ADMIN, email });
    } else {
      const managed = managedUsers.find(u => u.email === email && u.role === loginRole && u.active);
      if (managed) {
        setUser({
          id: managed.id,
          firstName: managed.firstName,
          lastName: managed.lastName,
          email: managed.email,
          phone: managed.phone,
          company: DEMO_ADMIN.company,
          role: managed.role,
          createdAt: managed.createdAt,
        });
      } else {
        setUser({
          ...DEMO_ADMIN,
          email,
          role: loginRole,
          firstName: loginRole === "finance" ? "Finance" : "Auditor",
          lastName: "User",
        });
      }
    }
    const token = `tok_${Date.now()}`;
    setToken(token);
    return true;
  }, [managedUsers]);

  const register = useCallback(async (data: any): Promise<boolean> => {
    try {
      const res = await api.post<{ user: User; token: string }>("/auth/register", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        companyName: data.companyName,
      });
      if (res.success && res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        return true;
      }
    } catch {
      console.info("Backend unavailable, using demo registration");
    }

    // Demo fallback
    setUser({ ...DEMO_ADMIN, ...data });
    setToken(`tok_${Date.now()}`);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearToken();
    localStorage.removeItem("cai_auth_user");
    // Fire and forget backend logout
    api.post("/auth/logout", {}).catch(() => {});
  }, []);

  const addManagedUser = useCallback((userData: Omit<ManagedUser, "id" | "createdAt" | "active">) => {
    const newUser: ManagedUser = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      active: true,
    };
    setManagedUsers(prev => [...prev, newUser]);
    // Sync to backend
    api.post("/auth/managed-users", userData).catch(() => {});
  }, []);

  const removeManagedUser = useCallback((id: string) => {
    setManagedUsers(prev => prev.filter(u => u.id !== id));
    api.delete(`/auth/managed-users/${id}`).catch(() => {});
  }, []);

  const toggleManagedUser = useCallback((id: string) => {
    setManagedUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
    api.patch(`/auth/managed-users/${id}/toggle`).catch(() => {});
  }, []);

  const hasPermission = useCallback((key: keyof RolePermissions) => {
    return permissions[key];
  }, [permissions]);

  return (
    <AuthContext.Provider value={{
      user, role, permissions, isAuthenticated: !!user,
      login, register, logout,
      managedUsers, addManagedUser, removeManagedUser, toggleManagedUser,
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
