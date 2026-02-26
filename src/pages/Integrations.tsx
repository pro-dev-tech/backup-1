import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, AlertTriangle, Shield, FileText, Loader2, Sparkles, X, Calendar, ChevronDown, ChevronUp, Scale, Clock, ExternalLink, CheckCircle, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";

interface Platform {
  id: string; name: string; description: string; apiStatus: string; icon: string;
  category: string; acceptedFormats: string[]; sampleFields: string[];
  evaluation: { violations: Violation[]; riskScore: number; riskLevel: string; lastEvaluated: string } | null;
  violationCount: number;
}

interface Violation {
  id: string; ruleId: string; platform: string; description: string; reason: string;
  severity: string; penaltyImpact: string; legalReference: string; timestamp: string;
}

interface EvalResult {
  violations: Violation[]; riskScore: number; riskLevel: string; rulesChecked: number;
  platform: string; platformId: string; calendarSuggestions: any[];
}

const apiStatusCfg: Record<string, { label: string; cls: string }> = {
  available: { label: "API Available", cls: "bg-success/15 text-success border-success/30" },
  restricted: { label: "Restricted API", cls: "bg-warning/15 text-warning border-warning/30" },
  unavailable: { label: "Upload Only", cls: "bg-muted text-muted-foreground border-border" },
  local: { label: "Local Access", cls: "bg-primary/15 text-primary border-primary/30" },
};

const sevCfg: Record<string, string> = {
  High: "border-destructive/30 bg-destructive/5",
  Medium: "border-warning/30 bg-warning/5",
  Low: "border-border bg-muted/30",
};

/**
 * Parse CSV: supports multi-row CSVs. If multiple rows, returns an object
 * with aggregated/first-row values and arrays for numeric fields.
 */
function parseCSV(text: string): Record<string, any> {
  const lines = text.trim().split("\n").filter(l => l.trim());
  if (lines.length < 2) return {};
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));

  // Parse all data rows
  const rows = lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, any> = {};
    headers.forEach((h, i) => {
      const val = values[i] ?? "";
      if (val === "true" || val === "false") row[h] = val === "true";
      else if (val === "null" || val === "") row[h] = null;
      else if (!isNaN(Number(val))) row[h] = Number(val);
      else row[h] = val;
    });
    return row;
  });

  if (rows.length === 1) return rows[0];

  // For multi-row: aggregate numerics (sum), use first row for strings/booleans
  const result: Record<string, any> = { ...rows[0], _rowCount: rows.length };
  headers.forEach(h => {
    const numericVals = rows.map(r => r[h]).filter(v => typeof v === "number");
    if (numericVals.length === rows.length) {
      // Sum numeric fields for aggregation
      result[h] = numericVals.reduce((a, b) => a + b, 0);
    }
  });
  return result;
}

export default function Integrations() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, EvalResult>>({});
  const [score, setScore] = useState<{ score: number; hasData: boolean }>({ score: 0, hasData: false });
  const [explaining, setExplaining] = useState<string | null>(null);
  const [explanationText, setExplanationText] = useState("");
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const [pendingCalendarEvents, setPendingCalendarEvents] = useState<any[] | null>(null);
  const [pendingPlatformName, setPendingPlatformName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchPlatforms(); fetchScore(); }, []);

  const fetchPlatforms = async () => {
    try { const r = await api.get<Platform[]>("/integrations"); setPlatforms(r.data); }
    catch { } finally { setLoading(false); }
  };

  const fetchScore = async () => {
    try { const r = await api.get<any>("/integrations/score"); setScore(r.data); } catch { }
  };

  const fetchAudit = async () => {
    try { const r = await api.get<any[]>("/integrations/audit-trail"); setAuditTrail(r.data); setShowAudit(true); } catch { }
  };

  const handleUpload = (id: string) => { setUploadTarget(id); fileRef.current?.click(); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    try {
      const text = await file.text();
      let data: Record<string, any>;
      if (file.name.endsWith(".csv")) {
        data = parseCSV(text);
      } else {
        data = JSON.parse(text);
      }
      if (Object.keys(data).length === 0) {
        toast({ title: "Empty Data", description: "The uploaded file contains no usable data.", variant: "destructive" });
        return;
      }
      toast({ title: "File parsed", description: `Extracted ${Object.keys(data).length} fields from ${file.name}. Running compliance engine...` });
      await evaluate(uploadTarget, data);
    } catch {
      toast({ title: "Parse Error", description: "Could not parse file. Ensure valid JSON or CSV format (headers + data rows).", variant: "destructive" });
    }
    e.target.value = ""; setUploadTarget(null);
  };

  const evaluate = async (id: string, data: Record<string, any>) => {
    setEvaluating(id); setExpanded(id);
    try {
      const r = await api.post<EvalResult>(`/integrations/${id}/evaluate`, { data });
      setResults(prev => ({ ...prev, [id]: r.data }));
      await fetchPlatforms(); await fetchScore();
      if (r.data.violations.length > 0) {
        toast({ title: `⚠️ ${r.data.violations.length} violation(s) found`, description: `Risk: ${r.data.riskLevel} | ${r.data.platform}`, variant: "destructive" });
      } else {
        toast({ title: "✅ All clear!", description: `No violations for ${r.data.platform}.` });
      }

      // Ask user permission before adding calendar events
      if (r.data.calendarSuggestions?.length > 0) {
        setPendingCalendarEvents(r.data.calendarSuggestions);
        setPendingPlatformName(r.data.platform);
      }
    } catch (err: any) {
      toast({ title: "Evaluation failed", description: err.message, variant: "destructive" });
    } finally { setEvaluating(null); }
  };

  const confirmAddCalendar = async () => {
    if (!pendingCalendarEvents) return;
    try {
      const r = await api.post<{ added: number }>("/integrations/calendar-add", { events: pendingCalendarEvents });
      toast({ title: "📅 Calendar updated", description: `${r.data.added} deadline(s) added to your compliance calendar.` });
    } catch {
      toast({ title: "Failed to update calendar", variant: "destructive" });
    }
    setPendingCalendarEvents(null);
    setPendingPlatformName("");
  };

  const declineCalendar = () => {
    setPendingCalendarEvents(null);
    setPendingPlatformName("");
    toast({ title: "Calendar update skipped", description: "Deadlines were not added to your calendar." });
  };

  const explainViolation = async (v: Violation) => {
    setExplaining(v.id); setExplanationText("");
    const context = `Explain this compliance violation:\n\nRule: ${v.ruleId}\nDescription: ${v.description}\nReason: ${v.reason}\nSeverity: ${v.severity}\nPenalty: ${v.penaltyImpact}\nLaw: ${v.legalReference}\n\nProvide: 1) What this means 2) Legal implications 3) Penalties 4) Remediation steps`;
    await streamExplanation(context);
  };

  const explainScore = async () => {
    setExplaining("score"); setExplanationText("");
    const allViolations = Object.values(results).flatMap(r => r.violations).map(v => `- [${v.severity}] ${v.ruleId}: ${v.description} (${v.legalReference})`).join("\n");
    const context = `Explain this compliance score:\n\nScore: ${score.score}/100\nViolations:\n${allViolations || "None"}\n\nProvide: 1) Score breakdown 2) Each violation's impact 3) Improvement recommendations 4) Priority remediation`;
    await streamExplanation(context);
  };

  const streamExplanation = async (context: string) => {
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
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const p = JSON.parse(payload);
            if (p.word !== undefined) { fullText += p.word; setExplanationText(fullText); }
            if (p.error) throw new Error(p.error);
          } catch { }
        }
      }
    } catch { setExplanationText("AI explanation unavailable. Check your API keys (COMPLIANCE_GROQ_API_KEY or COMPLIANCE_OPENROUTER_API_KEY)."); }
  };

  const riskColor = (level: string) => level === "High" ? "text-destructive" : level === "Medium" ? "text-warning" : "text-success";

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <input ref={fileRef} type="file" accept=".json,.csv,.xml" className="hidden" onChange={handleFile} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations & Compliance Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload your compliance data (CSV/JSON) — Rule-driven validation, AI-assisted explanations</p>
        </div>
        <button onClick={fetchAudit} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors">
          <History className="h-4 w-4" /> Audit Trail
        </button>
      </div>

      {/* Score Banner */}
      <div className="glass-card p-5 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${score.hasData ? (score.score >= 80 ? "bg-success/15" : score.score >= 50 ? "bg-warning/15" : "bg-destructive/15") : "bg-muted"}`}>
            <Shield className={`h-7 w-7 ${score.hasData ? (score.score >= 80 ? "text-success" : score.score >= 50 ? "text-warning" : "text-destructive") : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{score.hasData ? `${score.score}%` : "—"}</p>
            <p className="text-xs text-muted-foreground">{score.hasData ? "Rule-Based Compliance Score" : "Upload data to calculate score"}</p>
          </div>
        </div>
        {score.hasData && (
          <button onClick={explainScore} className="ml-auto flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-xs font-medium text-primary-foreground">
            <Sparkles className="h-4 w-4" /> AI Explain Score
          </button>
        )}
      </div>

      {/* Calendar Permission Dialog */}
      <AnimatePresence>
        {pendingCalendarEvents && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-5 border-2 border-primary/30">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Add compliance deadlines to your calendar?</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingCalendarEvents.length} deadline(s) detected for <strong>{pendingPlatformName}</strong>. 
                  These will be added to your Compliance Calendar and Dashboard.
                </p>
                <div className="mt-2 space-y-1">
                  {pendingCalendarEvents.slice(0, 5).map((ev, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      • {ev.title} — {ev.day}/{ev.month + 1}/{ev.year}
                    </p>
                  ))}
                  {pendingCalendarEvents.length > 5 && (
                    <p className="text-xs text-muted-foreground">...and {pendingCalendarEvents.length - 5} more</p>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={confirmAddCalendar}
                    className="flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-xs font-medium text-primary-foreground">
                    <CheckCircle className="h-3.5 w-3.5" /> Yes, update calendar
                  </button>
                  <button onClick={declineCalendar}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors">
                    <X className="h-3.5 w-3.5" /> No, skip
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Explanation Panel */}
      <AnimatePresence>
        {explaining && explanationText && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">AI Compliance Analysis</h3>
              </div>
              <button onClick={() => { setExplaining(null); setExplanationText(""); }} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="prose prose-sm max-w-none text-foreground/90 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(explanationText) }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Platform Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((p, i) => {
          const status = apiStatusCfg[p.apiStatus] || apiStatusCfg.unavailable;
          const result = results[p.id];
          const isExpanded = expanded === p.id;

          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden">
              {/* Card Header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">{p.icon}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.cls}`}>{status.label}</span>
                </div>

                {/* Accepted fields hint */}
                <div className="mb-3">
                  <p className="text-[10px] text-muted-foreground">
                    Expected fields: <span className="font-mono">{p.sampleFields.join(", ")}</span>
                  </p>
                </div>

                {/* Evaluation Status */}
                {p.evaluation && (
                  <div className="flex items-center gap-3 mb-3 text-xs">
                    <span className={`font-semibold ${riskColor(p.evaluation.riskLevel)}`}>Risk: {p.evaluation.riskLevel}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{p.violationCount} violation(s)</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(p.evaluation.lastEvaluated).toLocaleString()}</span>
                  </div>
                )}

                {/* Actions - Upload only, no sample/mock */}
                <div className="flex items-center gap-2">
                  <button onClick={() => handleUpload(p.id)} disabled={evaluating === p.id}
                    className="flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">
                    {evaluating === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    {evaluating === p.id ? "Analyzing..." : `Upload ${p.acceptedFormats.join("/")}`}
                  </button>
                  {(result || p.evaluation) && (
                    <button onClick={() => setExpanded(isExpanded ? null : p.id)}
                      className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline">
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {isExpanded ? "Hide" : "View"} Results
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Results */}
              <AnimatePresence>
                {isExpanded && (result || p.evaluation) && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border bg-secondary/20">
                    <div className="p-5 space-y-3">
                      {(result?.violations || p.evaluation?.violations || []).map((v) => (
                        <div key={v.id} className={`rounded-lg border p-3 ${sevCfg[v.severity] || sevCfg.Low}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${v.severity === "High" ? "text-destructive" : v.severity === "Medium" ? "text-warning" : "text-muted-foreground"}`} />
                                <span className="text-xs font-mono text-muted-foreground">{v.ruleId}</span>
                                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${v.severity === "High" ? "bg-destructive/15 text-destructive" : v.severity === "Medium" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{v.severity}</span>
                              </div>
                              <p className="text-sm font-medium text-foreground">{v.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">{v.reason}</p>
                              <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                                <span>⚖️ {v.legalReference}</span>
                                <span>💰 {v.penaltyImpact}</span>
                              </div>
                            </div>
                            <button onClick={() => explainViolation(v)}
                              className="shrink-0 flex items-center gap-1 rounded-lg border border-primary/30 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors">
                              <Sparkles className="h-3 w-3" /> Explain
                            </button>
                          </div>
                        </div>
                      ))}
                      {(result?.violations || p.evaluation?.violations || []).length === 0 && (
                        <div className="flex items-center gap-2 text-sm text-success">
                          <CheckCircle className="h-4 w-4" /> All rules passed — no violations detected.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Audit Trail Modal */}
      <AnimatePresence>
        {showAudit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={() => setShowAudit(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="glass-card w-full max-w-2xl mx-4 p-6 max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Compliance Audit Trail</h3>
                <button onClick={() => setShowAudit(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
              </div>
              <div className="overflow-y-auto space-y-2 flex-1 scrollbar-thin">
                {auditTrail.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No audit entries yet. Upload compliance data to generate entries.</p>
                ) : auditTrail.map((a, i) => (
                  <div key={i} className="rounded-lg bg-secondary/50 p-3 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-muted-foreground">{a.ruleId || a.type}</span>
                      <span className="text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</span>
                    </div>
                    {a.description && <p className="text-foreground">{a.description}</p>}
                    {a.reason && <p className="text-muted-foreground mt-0.5">{a.reason}</p>}
                    {a.severity && <span className={`inline-block mt-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${a.severity === "High" ? "bg-destructive/15 text-destructive" : a.severity === "Medium" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{a.severity}</span>}
                    {a.legalReference && <p className="text-muted-foreground mt-1">⚖️ {a.legalReference}</p>}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
