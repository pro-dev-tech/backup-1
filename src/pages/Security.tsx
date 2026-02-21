import { Link } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Security() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Security</h1>
        <p className="text-muted-foreground leading-relaxed">
          Nexus-Compliance is built with enterprise-grade security — 256-bit encryption, role-based access control, and audit-ready infrastructure. Full security documentation coming soon.
        </p>
        <Button asChild variant="outline">
          <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
