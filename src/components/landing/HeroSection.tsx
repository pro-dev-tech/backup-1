import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket, Search, TrendingUp, AlertTriangle, Newspaper, Shield } from "lucide-react";
import { motion } from "framer-motion";
import ComplianceScore from "@/components/ComplianceScore";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateY: -8 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
      className="relative"
    >
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-6 shadow-2xl shadow-primary/5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-destructive/60" />
          <div className="w-3 h-3 rounded-full bg-warning/60" />
          <div className="w-3 h-3 rounded-full bg-success/60" />
          <span className="ml-2 text-xs text-muted-foreground font-mono">dashboard.nexus-compliance.app</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex justify-center">
            <ComplianceScore score={87} size={120} />
          </div>
          <div className="space-y-3">
            <MockAlert icon={<AlertTriangle className="w-3.5 h-3.5 text-warning" />} text="3 GST filings due" color="warning" />
            <MockAlert icon={<TrendingUp className="w-3.5 h-3.5 text-success" />} text="TDS compliance: 94%" color="success" />
            <MockAlert icon={<Newspaper className="w-3.5 h-3.5 text-primary" />} text="2 new RBI circulars" color="primary" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MockStat label="Filings Done" value="42" />
          <MockStat label="Pending" value="5" />
          <MockStat label="Risk Score" value="Low" />
        </div>
      </div>

      {/* Glow effect */}
      <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-3xl -z-10" />
    </motion.div>
  );
}

function MockAlert({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-${color}/10 border border-${color}/20`}>
      {icon}
      <span className="text-xs text-foreground">{text}</span>
    </div>
  );
}

function MockStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 border border-border p-3 text-center">
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-20">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/6 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/4 rounded-full blur-[140px]" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left */}
          <div>
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6"
            >
              <Shield className="w-3.5 h-3.5" />
              AI-Powered Compliance Platform
            </motion.div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.1] tracking-tight mb-6"
            >
              AI-Powered Compliance Intelligence for{" "}
              <span className="gradient-primary-text">Modern Indian Businesses</span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg"
            >
              Automate GST, TDS, MCA, PF & regulatory monitoring with AI-driven risk detection and real-time compliance insights.
            </motion.p>

            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap gap-4"
            >
              <Link to="/register">
                <Button size="lg" className="rounded-xl text-base px-8 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]">
                  <Rocket className="w-4 h-4 mr-1" />
                  Get Started Free
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl text-base px-8 hover:scale-[1.02] transition-transform"
                onClick={() => document.querySelector("#dashboard-preview")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Search className="w-4 h-4 mr-1" />
                View Live Demo
              </Button>
            </motion.div>

            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-6 mt-10 text-xs text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                256-bit Encryption
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                SOC 2 Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                GDPR Ready
              </span>
            </motion.div>
          </div>

          {/* Right - Dashboard */}
          <div className="hidden lg:block">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
