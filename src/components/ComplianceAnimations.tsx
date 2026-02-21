import { motion } from "framer-motion";
import { Shield, FileCheck, Scale, BarChart3, Lock, CheckCircle } from "lucide-react";

const floatingIcons = [
  { Icon: Shield, x: "10%", y: "15%", delay: 0, duration: 8 },
  { Icon: FileCheck, x: "80%", y: "20%", delay: 1.5, duration: 9 },
  { Icon: Scale, x: "15%", y: "75%", delay: 3, duration: 7 },
  { Icon: BarChart3, x: "85%", y: "70%", delay: 2, duration: 10 },
  { Icon: Lock, x: "50%", y: "10%", delay: 4, duration: 8 },
  { Icon: CheckCircle, x: "70%", y: "85%", delay: 1, duration: 9 },
];

const orbitNodes = [
  { label: "GST", angle: 0 },
  { label: "PF", angle: 60 },
  { label: "ESI", angle: 120 },
  { label: "TDS", angle: 180 },
  { label: "ROC", angle: 240 },
  { label: "IT", angle: 300 },
];

export default function ComplianceAnimations() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.04, 0.08, 0.04] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary blur-[120px]"
      />
      <motion.div
        animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.03, 0.07, 0.03] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent blur-[100px]"
      />

      {/* Floating compliance icons */}
      {floatingIcons.map(({ Icon, x, y, delay, duration }, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: x, top: y }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.12, 0.06, 0.12, 0],
            y: [0, -20, 0, 20, 0],
            rotate: [0, 5, -5, 3, 0],
          }}
          transition={{ duration, repeat: Infinity, delay, ease: "easeInOut" }}
        >
          <Icon className="h-8 w-8 text-primary/20" />
        </motion.div>
      ))}

      {/* Central orbit ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="relative w-[500px] h-[500px]"
        >
          {/* Orbit ring */}
          <div className="absolute inset-0 rounded-full border border-primary/[0.06]" />

          {/* Orbit nodes */}
          {orbitNodes.map(({ label, angle }, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 250 + 250 * Math.cos(rad);
            const y = 250 + 250 * Math.sin(rad);
            return (
              <motion.div
                key={i}
                className="absolute flex items-center justify-center"
                style={{ left: x - 16, top: y - 16, width: 32, height: 32 }}
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              >
                <div className="rounded-full bg-primary/[0.08] border border-primary/[0.12] px-2 py-0.5">
                  <span className="text-[10px] font-medium text-primary/30">{label}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Scanning line */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}
