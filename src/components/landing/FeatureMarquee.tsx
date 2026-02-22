import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  BarChart3, Bot, Link2, Newspaper, CalendarDays,
  AlertTriangle, MessageSquare, FileText, ShieldCheck, Database,
  RefreshCw, Clock, EyeOff, FileSpreadsheet, Radio,
  Layers, Lock, Frown, CalendarX, TrendingDown,
} from "lucide-react";

const problems = [
  { icon: RefreshCw, title: "Frequent Regulatory Changes", color: "hsl(0 72% 51%)" },
  { icon: Clock, title: "Missed Filing Deadlines", color: "hsl(25 95% 53%)" },
  { icon: EyeOff, title: "No Risk Visibility", color: "hsl(0 72% 51%)" },
  { icon: FileSpreadsheet, title: "Manual & Spreadsheet-Based Tracking", color: "hsl(38 92% 50%)" },
  { icon: Radio, title: "Lack of Real-Time Monitoring", color: "hsl(25 95% 53%)" },
  { icon: Layers, title: "Information Overload", color: "hsl(38 92% 50%)" },
  { icon: Lock, title: "Limited Role-Based Access", color: "hsl(0 72% 51%)" },
  { icon: Frown, title: "Audit Stress", color: "hsl(25 95% 53%)" },
  { icon: CalendarX, title: "Poor Compliance Calendar Management", color: "hsl(38 92% 50%)" },
  { icon: TrendingDown, title: "Lack of Predictive Insights", color: "hsl(0 72% 51%)" },
];

const features = [
  { icon: BarChart3, title: "Dynamic Data Charts", color: "hsl(220 90% 56%)" },
  { icon: Bot, title: "AI Compliance Checker", color: "hsl(250 80% 62%)" },
  { icon: Link2, title: "Multiple Integrations", color: "hsl(220 90% 56%)" },
  { icon: Newspaper, title: "Real-Time Regulatory News Feed", color: "hsl(142 71% 45%)" },
  { icon: CalendarDays, title: "Compliance Calendar", color: "hsl(250 80% 62%)" },
  { icon: AlertTriangle, title: "Risk Monitor & Alerts", color: "hsl(38 92% 50%)" },
  { icon: MessageSquare, title: "AI Compliance Assistant", color: "hsl(220 90% 56%)" },
  { icon: FileText, title: "Automated Report Generation", color: "hsl(142 71% 45%)" },
  { icon: ShieldCheck, title: "Role-Based Access Control", color: "hsl(250 80% 62%)" },
  { icon: Database, title: "Secure Data Infrastructure", color: "hsl(220 90% 56%)" },
];

function ProblemCard({ icon: Icon, title, color }: { icon: any; title: string; color: string }) {
  return (
    <div
      className="flex-shrink-0 w-[260px] rounded-2xl border border-destructive/20 bg-card/80 backdrop-blur-sm p-5 hover:-translate-y-1 transition-all duration-300 cursor-default relative overflow-hidden group"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = `0 0 20px ${color.replace(")", " / 0.3)")}, 0 0 40px ${color.replace(")", " / 0.15)")}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color.replace(")", " / 0.12)")}` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, color }: { icon: any; title: string; color: string }) {
  return (
    <div
      className="flex-shrink-0 w-[260px] rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-sm p-5 hover:-translate-y-1 transition-all duration-300 cursor-default relative overflow-hidden group"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = `0 0 20px ${color.replace(")", " / 0.3)")}, 0 0 40px ${color.replace(")", " / 0.15)")}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color.replace(")", " / 0.12)")}` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

function MarqueeRow({
  items,
  direction,
  renderCard,
}: {
  items: { icon: any; title: string; color: string }[];
  direction: "left" | "right";
  renderCard: (item: { icon: any; title: string; color: string }, i: number) => React.ReactNode;
}) {
  // Triple the items to ensure seamless loop
  const tripled = [...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden py-2">
      <div
        className={`flex gap-5 ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"} hover:[animation-play-state:paused]`}
        style={{ width: "max-content" }}
      >
        {tripled.map((item, i) => (
          <div key={`${item.title}-${i}`}>{renderCard(item, i)}</div>
        ))}
      </div>
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

      <div className="space-y-6">
        {/* Problems row - left to right */}
        <div>
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-destructive/70 mb-3">
            ⚠️ Common Compliance Problems
          </p>
          <MarqueeRow
            items={problems}
            direction="right"
            renderCard={(item, i) => <ProblemCard key={i} {...item} />}
          />
        </div>

        {/* Features row - right to left */}
        <div>
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">
            ✅ Nexus-Compliance Solutions
          </p>
          <MarqueeRow
            items={features}
            direction="left"
            renderCard={(item, i) => <FeatureCard key={i} {...item} />}
          />
        </div>
      </div>
    </section>
  );
}
