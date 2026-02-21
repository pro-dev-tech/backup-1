import { Link } from "react-router-dom";
import { Twitter, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TwitterRedirect() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Twitter className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Twitter</h1>
        <p className="text-muted-foreground leading-relaxed">
          Our Twitter handle is coming soon. Stay tuned for real-time compliance updates and regulatory news.
        </p>
        <Button asChild variant="outline">
          <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
