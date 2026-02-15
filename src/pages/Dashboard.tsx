import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ComplianceScore from "@/components/ComplianceScore";
import { RiskTrendChart, FilingStatusChart, StateComplianceChart, MonthlyActivityChart } from "@/components/DashboardCharts";
import { DeadlineCards, RiskAlerts, ActivityTimeline, NewsFeed } from "@/components/DashboardWidgets";
import { Users, FileText, ShieldCheck, AlertTriangle, ClipboardList, ArrowRight, Newspaper } from "lucide-react";

const stats = [
  { label: "Total Compliances", value: "59", icon: FileText, change: "+3 this month" },
  { label: "Active Employees", value: "35", icon: Users, change: "Karnataka" },
  { label: "Compliant", value: "42", icon: ShieldCheck, change: "71% rate" },
  { label: "Pending Actions", value: "12", icon: AlertTriangle, change: "5 urgent" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Page header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-foreground">Compliance Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time overview of your regulatory compliance status</p>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="glass-card-hover p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <s.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-[10px] text-primary mt-0.5">{s.change}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Score + Deadlines + Alerts */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 glass-card p-5 flex items-center justify-center">
          <ComplianceScore score={82} />
        </div>
        <div className="lg:col-span-5">
          <DeadlineCards />
        </div>
        <div className="lg:col-span-4">
          <RiskAlerts />
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RiskTrendChart />
        <FilingStatusChart />
        <StateComplianceChart />
        <MonthlyActivityChart />
      </motion.div>

      {/* Compliance Checker CTA */}
      <motion.div variants={item}>
        <Link to="/compliance-checker" className="glass-card-hover p-5 flex items-center gap-4 group block">
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <ClipboardList className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground">Compliance Checker</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Enter your business details to instantly discover all applicable compliances, deadlines & penalties</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </Link>
      </motion.div>

      {/* Activity + News */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityTimeline />
        <NewsFeed />
      </motion.div>

      {/* News Feed CTA */}
      <motion.div variants={item}>
        <Link to="/news-feed" className="glass-card-hover p-5 flex items-center gap-4 group block">
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Newspaper className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground">Regulatory News Feed</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Enable live regulatory updates — GST amendments, MCA notifications, labour law changes & more</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
