import { useAuth } from "@/contexts/AuthContext";
import type { RolePermissions } from "@/backend/types";
import { ShieldOff } from "lucide-react";

interface RoleGuardProps {
  permission: keyof RolePermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
      <ShieldOff className="h-8 w-8 text-destructive" />
    </div>
    <h2 className="text-lg font-semibold text-foreground mb-1">You have no access for this</h2>
    <p className="text-sm text-muted-foreground max-w-sm">
      Your current role doesn't have permission to access this feature. Contact your administrator.
    </p>
  </div>
);

export default function RoleGuard({ permission, children, fallback }: RoleGuardProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <>{fallback || <DefaultFallback />}</>;
  }

  return <>{children}</>;
}
