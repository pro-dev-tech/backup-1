import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import ComplianceScore from "@/components/ComplianceScore";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { CalendarDays, MessageSquare, Newspaper, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

const lineData = [
  { m: "Jul", s: 65 }, { m: "Aug", s: 72 }, { m: "Sep", s: 68 },
  { m: "Oct", s: 75 }, { m: "Nov", s: 82 }, { m: "Dec", s: 85 },
];
const pieData = [
  { name: "Filed", value: 42, color: "hsl(142 71% 45%)" },
  { name: "Pending", value: 8, color: "hsl(38 92% 50%)" },
  { name: "Overdue", value: 3, color: "hsl(0 72% 51%)" },
];
const barData = [
  { s: "MH", v: 92 }, { s: "KA", v: 85 }, { s: "DL", v: 78 },
  { s: "TN", v: 88 }, { s: "GJ", v: 70 },
];

const newsItems = [
  "CBDT extends ITR due date for FY 2025-26",
  "New GST e-invoice limit: ₹5 Cr from Apr 2026",
  "MCA notifies CARO 2026 amendments",
];

export default function DashboardPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="dashboard-preview" className="py-24 relative" ref={ref}>
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/4 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            See Nexus-Compliance <span className="gradient-primary-text">in Action</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A powerful dashboard designed for compliance teams, auditors, and business owners.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-6 lg:p-8 shadow-2xl shadow-primary/5"
        >
          {/* Browser bar */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
            <div className="w-3 h-3 rounded-full bg-destructive/50" />
            <div className="w-3 h-3 rounded-full bg-warning/50" />
            <div className="w-3 h-3 rounded-full bg-success/50" />
            <div className="ml-3 px-4 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground font-mono flex-1 max-w-xs">
              app.nexus-compliance.com/dashboard
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Compliance Score */}
            <div className="rounded-xl border border-border bg-background/50 p-5 flex flex-col items-center justify-center">
              <ComplianceScore score={87} size={140} />
            </div>

            {/* Line Chart */}
            <div className="rounded-xl border border-border bg-background/50 p-5">
              <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary" /> Risk Trend
              </h4>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="m" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} domain={[50, 100]} />
                  <Line type="monotone" dataKey="s" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Filing Status */}
            <div className="rounded-xl border border-border bg-background/50 p-5">
              <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Filing Status
              </h4>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* State Compliance */}
            <div className="rounded-xl border border-border bg-background/50 p-5">
              <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" /> State Compliance
              </h4>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={barData}>
                  <XAxis dataKey="s" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Bar dataKey="v" radius={[4, 4, 0, 0]} fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* News */}
            <div className="rounded-xl border border-border bg-background/50 p-5">
              <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5 text-primary" /> Regulatory News
              </h4>
              <div className="space-y-2.5">
                {newsItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar + AI */}
            <div className="rounded-xl border border-border bg-background/50 p-5">
              <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-accent" /> AI Assistant
              </h4>
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  What's the GST filing deadline for Q4?
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-xs text-foreground">
                  The GSTR-3B for Q4 FY 2025-26 is due by April 22, 2026.
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
