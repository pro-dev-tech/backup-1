import { Link } from "react-router-dom";
import { HelpCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <HelpCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Help Center</h1>
        <p className="text-muted-foreground leading-relaxed">
          Our help center is under construction. For immediate assistance, please reach out via the contact section on our homepage.
        </p>
        <Button asChild variant="outline">
          <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
