import { useMemo } from "react";

interface Props {
  password: string;
}

export default function PasswordStrength({ password }: Props) {
  const { score, label, color } = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;

    if (s <= 1) return { score: 1, label: "Weak", color: "bg-destructive" };
    if (s <= 2) return { score: 2, label: "Fair", color: "bg-warning" };
    if (s <= 3) return { score: 3, label: "Good", color: "bg-primary" };
    return { score: 4, label: "Strong", color: "bg-success" };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? color : "bg-border"}`} />
        ))}
      </div>
      <p className={`text-xs ${score <= 1 ? "text-destructive" : score <= 2 ? "text-warning" : score <= 3 ? "text-primary" : "text-success"}`}>
        {label}
      </p>
    </div>
  );
}
