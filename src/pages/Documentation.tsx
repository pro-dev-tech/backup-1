import { Link } from "react-router-dom";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Documentation() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Documentation</h1>
        <p className="text-muted-foreground leading-relaxed">
          Comprehensive documentation for Nexus-Compliance is being prepared. It will cover setup guides, API references, and best practices.
        </p>
        <Button asChild variant="outline">
          <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
