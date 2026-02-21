import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  BarChart3, Bot, Link2, Newspaper, CalendarDays,
  AlertTriangle, MessageSquare, FileText, ShieldCheck, Database,
} from "lucide-react";

const features = [
  { icon: BarChart3, title: "Dynamic Data Charts", desc: "Real-time compliance analytics and trend visualizations" },
  { icon: Bot, title: "AI Compliance Checker", desc: "Automated regulatory compliance scanning with AI" },
  { icon: Link2, title: "Multiple Integrations", desc: "Connect GST, MCA, RBI portals and more" },
  { icon: Newspaper, title: "Regulatory News Feed", desc: "Live updates from regulatory bodies across India" },
  { icon: CalendarDays, title: "Compliance Calendar", desc: "Track filing deadlines, due dates & reminders" },
  { icon: AlertTriangle, title: "Risk Monitor & Alerts", desc: "Proactive risk detection with instant alerts" },
  { icon: MessageSquare, title: "AI Compliance Assistant", desc: "Chat-based AI for compliance queries" },
  { icon: FileText, title: "Report Generation", desc: "Auto-generate audit-ready compliance reports" },
  { icon: ShieldCheck, title: "Role-Based Access", desc: "Granular permissions for admin, finance & auditor" },
  { icon: Database, title: "Secure Infrastructure", desc: "Enterprise-grade security for sensitive data" },
];

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex-shrink-0 w-[280px] rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 group cursor-default">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function MarqueeRow({ features: items, direction }: { features: { icon: any; title: string; desc: string }[]; direction: "left" | "right" }) {
  const features = items;
  const doubled = [...features, ...features];
  return (
    <div className="relative overflow-hidden py-2 group">
      <motion.div
        className="flex gap-5"
        animate={{ x: direction === "left" ? [0, -50 * features.length + "%"] : [-50 * features.length + "%", 0] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        style={{ width: "fit-content" }}
        whileHover={{ animationPlayState: "paused" }}
      >
        {doubled.map((f, i) => (
          <FeatureCard key={`${f.title}-${i}`} {...f} />
        ))}
      </motion.div>
    </div>
  );
}

export default function FeatureMarquee() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-24 overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Powerful Compliance <span className="gradient-primary-text">Features</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to stay compliant, reduce risk, and automate regulatory workflows.
          </p>
        </motion.div>
      </div>

      <div className="space-y-5">
        <MarqueeRow features={features.slice(0, 5)} direction="left" />
        <MarqueeRow features={features.slice(5)} direction="right" />
      </div>
    </section>
  );
}
