import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, AlertTriangle, Shield, FileText, Loader2, Sparkles, X, Calendar, ChevronDown, ChevronUp, Scale, Clock, ExternalLink, CheckCircle, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { setEvaluation, addAuditEntry, getAuditTrail, getComplianceScore, addCalendarEvent } from "@/lib/firestore";
import { renderMarkdown } from "@/lib/markdown";

const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || "http://localhost:5000";

interface Platform {
  id: string; name: string; description: string; apiStatus: string; icon: string;
  category: string; acceptedFormats: string[]; sampleFields: string[];
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

function parseCSV(text: string): Record<string, any> {
  const lines = text.trim().split("\n").filter(l => l.trim());
  if (lines.length < 2) return {};
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, any> = {};
    headers.forEach((h, i) => {
      const val = values[i] ?? "";
      if (val === "true" || val === "false") row[h] = val === "true";
      else if (val === "null" || val === "") row[h] = null;
      else if (!isNaN(Number(val)) && val !== "") row[h] = Number(val);
      else row[h] = val;
    });
    return row;
  });
  if (rows.length === 1) return rows[0];
  const result: Record<string, any> = { ...rows[0], _rowCount: rows.length };
  headers.forEach(h => {
    const numericVals = rows.map(r => r[h]).filter(v => typeof v === "number");
    if (numericVals.length === rows.length) result[h] = numericVals.reduce((a, b) => a + b, 0);
  });
  return result;
}

function parseXML(text: string): Record<string, any> {
  const result: Record<string, any> = {};
  const tagRegex = /<(\w+)>(.*?)<\/\1>/gs;
  let match;
  while ((match = tagRegex.exec(text)) !== null) {
    const key = match[1]; const val = match[2].trim();
    if (val === "true" || val === "false") result[key] = val === "true";
    else if (!isNaN(Number(val)) && val !== "") result[key] = Number(val);
    else result[key] = val;
  }
  return result;
}

export default function Integrations() {
  const { firebaseUser } = useAuth();
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
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchPlatforms(); fetchScore(); }, [firebaseUser]);

  const fetchPlatforms = async () => {
    try {
      const res = await fetch(`${AI_SERVER_URL}/api/integrations`);
      const json = await res.json();
      if (json.success) setPlatforms(json.data);
    } catch { }
    finally { setLoading(false); }
  };

  const fetchScore = async () => {
    if (!firebaseUser) return;
    try {
      const data = await getComplianceScore(firebaseUser.uid);
      setScore(data);
    } catch { }
  };

  const fetchAudit = async () => {
    if (!firebaseUser) return;
    try {
      const entries = await getAuditTrail(firebaseUser.uid);
      setAuditTrail(entries);
      setShowAudit(true);
    } catch { }
  };

  const handleUpload = (id: string) => { setUploadTarget(id); fileRef.current?.click(); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    try {
      if (ext === "csv") {
        const text = await file.text();
        const data = parseCSV(text);
        if (Object.keys(data).length === 0) { toast({ title: "Empty Data", description: "CSV contains no usable data rows.", variant: "destructive" }); return; }
        toast({ title: "CSV parsed", description: `Extracted ${Object.keys(data).length} fields. Running compliance engine...` });
        await evaluate(uploadTarget, data);
      } else if (ext === "json") {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data || typeof data !== "object" || Object.keys(data).length === 0) { toast({ title: "Invalid JSON", variant: "destructive" }); return; }
        toast({ title: "JSON parsed", description: `Extracted ${Object.keys(data).length} fields. Running compliance engine...` });
        await evaluate(uploadTarget, data);
      } else if (ext === "xml") {
        const text = await file.text();
        const data = parseXML(text);
        if (Object.keys(data).length === 0) { toast({ title: "Empty XML", variant: "destructive" }); return; }
        await evaluate(uploadTarget, data);
      } else if (["pdf", "txt", "doc", "docx", "xls", "xlsx"].includes(ext)) {
        setParsing(true);
        toast({ title: "Processing document...", description: `Sending ${file.name} to AI parser.` });
        let content = "";
        if (ext === "pdf") {
          const ab = await file.arrayBuffer();
          const decoder = new TextDecoder("utf-8", { fatal: false });
          const rawText = decoder.decode(new Uint8Array(ab));
          const parts: string[] = [];
          const tjRegex = /\(([^)]*)\)/g; let m;
          while ((m = tjRegex.exec(rawText)) !== null) { if (m[1].length > 1 && /[a-zA-Z0-9]/.test(m[1])) parts.push(m[1]); }
          content = parts.length > 20 ? parts.join(" ") : rawText.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").slice(0, 15000);
        } else { content = await file.text(); }
        if (!content || content.trim().length < 10) { toast({ title: "Unreadable Document", variant: "destructive" }); setParsing(false); return; }
        try {
          const platformInfo = platforms.find(p => p.id === uploadTarget);
          const res = await fetch(`${AI_SERVER_URL}/api/compliance-ai/parse`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: content.slice(0, 15000), platform: platformInfo?.name || uploadTarget, filename: file.name }),
          });
          const json = await res.json();
          if (json.data && typeof json.data === "object" && Object.keys(json.data).length > 0) {
            toast({ title: `AI parsed ${file.name}`, description: `Extracted ${Object.keys(json.data).length} fields. Running compliance engine...` });
            await evaluate(uploadTarget, json.data);
          } else { toast({ title: "AI parsing failed", variant: "destructive" }); }
        } catch (err: any) { toast({ title: "AI Parse Error", description: err.message, variant: "destructive" }); }
        setParsing(false);
      } else { toast({ title: "Unsupported format", variant: "destructive" }); }
    } catch (err: any) { toast({ title: "Parse Error", description: err.message, variant: "destructive" }); setParsing(false); }
    e.target.value = ""; setUploadTarget(null);
  };

  const evaluate = async (id: string, data: Record<string, any>) => {
    setEvaluating(id); setExpanded(id);
    try {
      // Send to Express rule engine
      const res = await fetch(`${AI_SERVER_URL}/api/integrations/${id}/evaluate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Evaluation failed");
      const evalResult: EvalResult = json.data;
      setResults(prev => ({ ...prev, [id]: evalResult }));

      // Persist to Firestore
      if (firebaseUser) {
        await setEvaluation(firebaseUser.uid, id, {
          violations: evalResult.violations,
          riskScore: evalResult.riskScore,
          riskLevel: evalResult.riskLevel,
          rulesChecked: evalResult.rulesChecked,
          platform: evalResult.platform,
          platformId: evalResult.platformId,
        });
        // Audit trail entries
        for (const v of evalResult.violations) {
          await addAuditEntry(firebaseUser.uid, {
            ruleId: v.ruleId, description: v.description, reason: v.reason,
            severity: v.severity, legalReference: v.legalReference, platform: v.platform,
            timestamp: v.timestamp,
          });
        }
      }

      await fetchScore();

      if (evalResult.violations.length > 0) {
        toast({ title: `⚠️ ${evalResult.violations.length} violation(s) found`, description: `Risk: ${evalResult.riskLevel} | ${evalResult.platform}`, variant: "destructive" });
      } else {
        toast({ title: "✅ All clear!", description: `No violations for ${evalResult.platform}.` });
      }

      if (evalResult.calendarSuggestions?.length > 0) {
        setPendingCalendarEvents(evalResult.calendarSuggestions);
        setPendingPlatformName(evalResult.platform);
      }
    } catch (err: any) {
      toast({ title: "Evaluation failed", description: err.message, variant: "destructive" });
    } finally { setEvaluating(null); }
  };

  const confirmAddCalendar = async () => {
    if (!pendingCalendarEvents || !firebaseUser) return;
    try {
      let added = 0;
      for (const ev of pendingCalendarEvents) {
        await addCalendarEvent(firebaseUser.uid, ev);
        added++;
      }
      toast({ title: "📅 Calendar updated", description: `${added} deadline(s) added to your compliance calendar.` });
    } catch { toast({ title: "Failed to update calendar", variant: "destructive" }); }
    setPendingCalendarEvents(null); setPendingPlatformName("");
  };

  const declineCalendar = () => {
    setPendingCalendarEvents(null); setPendingPlatformName("");
    toast({ title: "Calendar update skipped" });
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
      const resp = await fetch(`${AI_SERVER_URL}/api/compliance-ai/explain`, {
        method: "POST", headers: { "Content-Type": "application/json" },
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
          const line = buffer.slice(0, idx).trim(); buffer = buffer.slice(idx + 1);
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try { const p = JSON.parse(payload); if (p.word !== undefined) { fullText += p.word; setExplanationText(fullText); } if (p.error) throw new Error(p.error); } catch { }
        }
      }
    } catch { setExplanationText("AI explanation unavailable. Ensure Express server is running with INTEGRATION_GROQ_API_KEY."); }
  };

  const riskColor = (level: string) => level === "High" ? "text-destructive" : level === "Medium" ? "text-warning" : "text-success";

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <input ref={fileRef} type="file" accept=".json,.csv,.xml,.pdf,.txt,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleFile} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations & Compliance Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload compliance documents — Rule-driven validation, AI-assisted parsing & explanations</p>
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

      {parsing && (
        <div className="glass-card p-4 flex items-center gap-3 border-2 border-primary/20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">AI Document Parser Active</p>
            <p className="text-xs text-muted-foreground">Extracting structured compliance data...</p>
          </div>
        </div>
      )}

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
                </p>
                <div className="mt-2 space-y-1">
                  {pendingCalendarEvents.slice(0, 5).map((ev, i) => (
                    <p key={i} className="text-xs text-muted-foreground">• {ev.title} — {ev.day}/{ev.month + 1}/{ev.year}</p>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={confirmAddCalendar} className="flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-xs font-medium text-primary-foreground">
                    <CheckCircle className="h-3.5 w-3.5" /> Yes, update calendar
                  </button>
                  <button onClick={declineCalendar} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors">
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
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold text-foreground">AI Compliance Analysis</h3></div>
              <button onClick={() => { setExplaining(null); setExplanationText(""); }} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
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

                <div className="mb-3">
                  <p className="text-[10px] text-muted-foreground">Expected fields: <span className="font-mono">{p.sampleFields.join(", ")}</span></p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Accepts: <span className="font-semibold">{p.acceptedFormats.join(", ")}</span></p>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleUpload(p.id)} disabled={evaluating === p.id || parsing}
                    className="flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">
                    {evaluating === p.id || parsing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    {evaluating === p.id ? "Analyzing..." : parsing ? "AI Parsing..." : `Upload ${p.acceptedFormats.join("/")}`}
                  </button>
                  {result && (
                    <button onClick={() => setExpanded(isExpanded ? null : p.id)}
                      className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline">
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {isExpanded ? "Hide" : "View"} Results
                    </button>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && result && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border bg-secondary/20">
                    <div className="p-5 space-y-3">
                      {result.violations.map((v) => (
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
                      {result.violations.length === 0 && (
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
                  <p className="text-sm text-muted-foreground">No audit entries yet.</p>
                ) : auditTrail.map((a: any, i: number) => (
                  <div key={i} className="rounded-lg bg-secondary/50 p-3 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-muted-foreground">{a.ruleId || a.type}</span>
                      <span className="text-muted-foreground">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ""}</span>
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
