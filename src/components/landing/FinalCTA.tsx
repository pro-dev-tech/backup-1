import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Rocket, LogIn } from "lucide-react";

export default function FinalCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" className="py-28 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/8 rounded-full blur-[140px] -z-10" />

      <div className="max-w-3xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
            Stop Compliance Risks Before They Become{" "}
            <span className="gradient-primary-text">Penalties</span>.
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join hundreds of Indian businesses using AI-powered compliance intelligence to stay ahead of regulations.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="rounded-xl text-base px-10 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all">
                <Rocket className="w-4 h-4 mr-1.5" />
                Create Free Account
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="rounded-xl text-base px-10 hover:scale-[1.02] transition-transform">
                <LogIn className="w-4 h-4 mr-1.5" />
                Login to Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
