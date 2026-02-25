import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ComplianceScore from "@/components/ComplianceScore";
import { RiskTrendChart, FilingStatusChart, StateComplianceChart, MonthlyActivityChart } from "@/components/DashboardCharts";
import { DeadlineCards, RiskAlerts, ActivityTimeline } from "@/components/DashboardWidgets";
import { Users, FileText, ShieldCheck, AlertTriangle, ClipboardList, ArrowRight, Newspaper, Sparkles, Loader2, X } from "lucide-react";
import { api } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [explaining, setExplaining] = useState(false);
  const [explanationText, setExplanationText] = useState("");

  useEffect(() => {
    api.get<any>("/dashboard")
      .then(r => setDashData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const score = dashData?.hasEvaluations ? dashData.complianceScore : 0;
  const hasData = dashData?.hasEvaluations || false;

  const stats = dashData?.stats || [
    { label: "Total Compliances", value: "—", icon: "FileText", change: "" },
    { label: "Active Employees", value: "—", icon: "Users", change: "" },
    { label: "Compliant", value: "—", icon: "ShieldCheck", change: "" },
    { label: "Pending Actions", value: "—", icon: "AlertTriangle", change: "" },
  ];

  const iconMap: Record<string, React.ElementType> = { FileText, Users, ShieldCheck, AlertTriangle };

  const explainScore = async () => {
    setExplaining(true); setExplanationText("");
    const violations = (dashData?.triggeredRules || []).map((r: any) => `- [${r.severity}] ${r.ruleId}: ${r.condition} → ${r.result} (${r.legalReference})`).join("\n");
    const context = `Explain this compliance score with proof:\n\nScore: ${score}/100\nEvaluated Platforms: ${dashData?.evaluatedPlatforms || 0}\nTriggered Rules:\n${violations || "None"}\n\nProvide: 1) Score breakdown 2) Impact of each violation 3) Improvement steps 4) Priority actions`;

    try {
      const token = localStorage.getItem("cai_auth_token");
      const resp = await fetch("/api/compliance-ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ context }),
      });
      if (!resp.ok || !resp.body) throw new Error("Stream failed");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line.startsWith("data: ")) continue;
          const p = line.slice(6).trim();
          if (p === "[DONE]") break;
          try { const j = JSON.parse(p); if (j.word !== undefined) { fullText += j.word; setExplanationText(fullText); } } catch { }
        }
      }
    } catch { setExplanationText("AI explanation unavailable. Configure COMPLIANCE_GROQ_API_KEY."); }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-foreground">Compliance Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time overview of your regulatory compliance status</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s: any, i: number) => {
          const Icon = iconMap[s.icon] || FileText;
          return (
            <div key={i} className="glass-card-hover p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-[10px] text-primary mt-0.5">{s.change}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Score + AI Explain + Deadlines + Alerts */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 glass-card p-5 flex flex-col items-center justify-center gap-3">
          <ComplianceScore score={score} label={hasData ? "Rule-Based Score" : "No Evaluations Yet"} />
          {hasData && (
            <button onClick={explainScore} disabled={explaining}
              className="flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
              {explaining ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              AI Explain
            </button>
          )}
          {!hasData && (
            <Link to="/integrations" className="text-xs text-primary hover:underline">Run integrations to calculate →</Link>
          )}
        </div>
        <div className="lg:col-span-5"><DeadlineCards /></div>
        <div className="lg:col-span-4"><RiskAlerts /></div>
      </motion.div>

      {/* AI Explanation */}
      {explanationText && (
        <motion.div variants={item} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Compliance Score Analysis</h3>
            </div>
            <button onClick={() => { setExplaining(false); setExplanationText(""); }} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
          </div>
          <div className="prose prose-sm max-w-none text-foreground/90 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(explanationText) }} />
        </motion.div>
      )}

      {/* Triggered Rules */}
      {dashData?.triggeredRules?.length > 0 && (
        <motion.div variants={item} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Triggered Compliance Rules</h3>
          <div className="space-y-2">
            {dashData.triggeredRules.slice(0, 5).map((r: any, i: number) => (
              <div key={i} className={`flex items-center gap-3 rounded-lg border p-3 ${r.severity === "High" ? "border-destructive/30 bg-destructive/5" : r.severity === "Medium" ? "border-warning/30 bg-warning/5" : "border-border bg-secondary/30"}`}>
                <AlertTriangle className={`h-4 w-4 shrink-0 ${r.severity === "High" ? "text-destructive" : r.severity === "Medium" ? "text-warning" : "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.condition}</p>
                  <p className="text-xs text-muted-foreground">{r.result}</p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">{r.ruleId}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RiskTrendChart />
        <FilingStatusChart />
        <StateComplianceChart />
        <MonthlyActivityChart />
      </motion.div>

      {/* CTAs */}
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

      <motion.div variants={item}><ActivityTimeline /></motion.div>

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
