import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Lock, ShieldCheck, Landmark, FileCheck, Zap, KeyRound } from "lucide-react";

const badges = [
  { icon: Lock, title: "256-bit Encryption", desc: "Bank-grade encryption for all data at rest and in transit" },
  { icon: ShieldCheck, title: "Enterprise Security", desc: "Multi-layer security architecture with continuous monitoring" },
  { icon: Landmark, title: "Indian Regulations", desc: "Purpose-built for Companies Act, GST, PF, TDS & more" },
  { icon: FileCheck, title: "Audit-Ready Reports", desc: "Generate compliance reports that meet auditor standards" },
  { icon: Zap, title: "Real-Time Monitoring", desc: "Instant alerts on regulatory changes and compliance risks" },
  { icon: KeyRound, title: "Role-Based Access", desc: "Granular permissions for admins, finance teams & auditors" },
];

export default function TrustSecurity() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 relative" ref={ref}>
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-success/3 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Built for Security & <span className="gradient-primary-text">Regulatory Trust</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Enterprise-grade security designed specifically for Indian compliance requirements.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 25 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 hover:border-success/30 hover:shadow-lg hover:shadow-success/5 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4 group-hover:bg-success/15 transition-colors">
                <badge.icon className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{badge.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{badge.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
