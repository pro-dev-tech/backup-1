import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { UserPlus, Link2, ScanSearch, Activity } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Register Your Business", desc: "Create your account and add your company profile in minutes." },
  { icon: Link2, title: "Connect Integrations", desc: "Link GST, MCA, PF, TDS portals for automated data sync." },
  { icon: ScanSearch, title: "Run AI Compliance Scan", desc: "Our AI scans regulations and flags risks in real-time." },
  { icon: Activity, title: "Monitor & Take Action", desc: "Track compliance scores, get alerts, and generate reports." },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="py-24 bg-muted/30" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How It <span className="gradient-primary-text">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Get compliant in 4 simple steps. No complex setup required.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="flex flex-col items-center text-center relative"
            >
              <div className="relative mb-5">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center relative z-10">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold z-20">
                  {i + 1}
                </div>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
