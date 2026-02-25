import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, TrendingDown, TrendingUp, ArrowRight, GitBranch, Zap, Loader2, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

interface Violation {
  id: string; ruleId: string; platform: string; description: string; reason: string;
  severity: string; penaltyImpact: string; legalReference: string;
}

interface RiskFactor {
  id: string; label: string; score: number; trend: string; change: number;
}

export default function RiskMonitor() {
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>("/risk").then(r => setRiskFactors(r.data.factors || [])).catch(() => {}),
      api.get<Violation[]>("/integrations/violations").then(r => setViolations(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  // Compute dynamic risk score
  const totalRiskPoints = violations.reduce((sum, v) => sum + (v.severity === "High" ? 20 : v.severity === "Medium" ? 10 : 5), 0);
  const riskLevel = totalRiskPoints <= 20 ? "Low" : totalRiskPoints <= 50 ? "Medium" : "High";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Risk Monitor</h1>
        <p className="text-sm text-muted-foreground mt-1">Rule-driven compliance risk assessment — deterministic, auditable</p>
      </div>

      {/* Overall Risk */}
      {violations.length > 0 && (
        <div className={`glass-card p-5 border ${riskLevel === "High" ? "border-destructive/30" : riskLevel === "Medium" ? "border-warning/30" : "border-success/30"}`}>
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${riskLevel === "High" ? "bg-destructive/15" : riskLevel === "Medium" ? "bg-warning/15" : "bg-success/15"}`}>
              <ShieldAlert className={`h-6 w-6 ${riskLevel === "High" ? "text-destructive" : riskLevel === "Medium" ? "text-warning" : "text-success"}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Aggregate Risk Level: <span className={riskLevel === "High" ? "text-destructive" : riskLevel === "Medium" ? "text-warning" : "text-success"}>{riskLevel}</span></p>
              <p className="text-xs text-muted-foreground">{totalRiskPoints} risk points from {violations.length} violation(s) across {new Set(violations.map(v => v.platform)).size} platform(s)</p>
            </div>
          </div>
        </div>
      )}

      {/* Risk factors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {riskFactors.map((f, i) => (
          <div key={f.id} className="glass-card-hover p-4">
            <p className="text-xs text-muted-foreground mb-2">{f.label}</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-foreground">{f.score}</span>
              <div className={`flex items-center gap-1 text-xs font-medium ${f.trend === "up" ? "text-success" : "text-destructive"}`}>
                {f.trend === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {f.change > 0 ? "+" : ""}{f.change}%
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-secondary">
              <motion.div className={`h-full rounded-full ${f.score >= 80 ? "bg-success" : f.score >= 60 ? "bg-warning" : "bg-destructive"}`}
                initial={{ width: 0 }} animate={{ width: `${f.score}%` }} transition={{ duration: 1, delay: i * 0.1 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Triggered Violations from Rule Engine */}
      {violations.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="text-lg font-semibold text-foreground">Active Violations ({violations.length})</h3>
          </div>
          <div className="space-y-3">
            {violations.map((v, i) => (
              <motion.div key={v.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 rounded-xl border p-4 ${v.severity === "High" ? "border-destructive/30 bg-destructive/5" : v.severity === "Medium" ? "border-warning/30 bg-warning/5" : "border-border bg-secondary/30"}`}>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${v.severity === "High" ? "bg-destructive/20" : v.severity === "Medium" ? "bg-warning/20" : "bg-secondary"}`}>
                  <Zap className={`h-4 w-4 ${v.severity === "High" ? "text-destructive" : v.severity === "Medium" ? "text-warning" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-muted-foreground">{v.ruleId}</span>
                    <span className="text-xs text-muted-foreground uppercase">{v.platform}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{v.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{v.reason}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">⚖️ {v.legalReference} · 💰 {v.penaltyImpact}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold shrink-0 ${v.severity === "High" ? "bg-destructive/15 text-destructive" : v.severity === "Medium" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>
                  {v.severity}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Static Rule Engine Visualization */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <GitBranch className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-foreground">Compliance Rule Engine</h3>
        </div>
        <div className="space-y-3">
          {[
            { condition: "Revenue > ₹40L", result: "GST Registration Mandatory", triggered: violations.some(v => v.platform === "gstn") },
            { condition: "Employees > 20", result: "PF Applicable", triggered: violations.some(v => v.platform === "epfo") },
            { condition: "Employees > 10", result: "ESIC Applicable", triggered: violations.some(v => v.ruleId?.startsWith("EPFO")) },
            { condition: "Revenue > ₹1Cr", result: "Tax Audit Required", triggered: violations.some(v => v.platform === "incometax") },
            { condition: "Inter-state sales", result: "E-way Bill Required", triggered: false },
          ].map((rule, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-4 rounded-xl border p-4 ${rule.triggered ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/30"}`}>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${rule.triggered ? "bg-primary/20" : "bg-secondary"}`}>
                <Zap className={`h-4 w-4 ${rule.triggered ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex items-center gap-3 flex-1">
                <span className={`text-sm font-medium ${rule.triggered ? "text-foreground" : "text-muted-foreground"}`}>{rule.condition}</span>
                <ArrowRight className={`h-4 w-4 ${rule.triggered ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${rule.triggered ? "text-foreground" : "text-muted-foreground"}`}>{rule.result}</span>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${rule.triggered ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                {rule.triggered ? "TRIGGERED" : "INACTIVE"}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {violations.length === 0 && (
        <div className="glass-card p-8 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No violations detected. Run platform evaluations in <a href="/integrations" className="text-primary hover:underline">Integrations</a> to see live risk data.</p>
        </div>
      )}
    </motion.div>
  );
}
