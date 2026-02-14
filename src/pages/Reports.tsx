import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileBarChart, Download, Filter, Plus, X, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Report {
  name: string; period: string; generated: string; type: string;
}

const initialReports: Report[] = [
  { name: "Monthly Compliance Summary", period: "January 2026", generated: "Feb 5, 2026", type: "PDF" },
  { name: "GST Filing Report", period: "Q3 FY2025-26", generated: "Jan 15, 2026", type: "Excel" },
  { name: "Employee PF Compliance", period: "FY2025-26", generated: "Feb 1, 2026", type: "PDF" },
  { name: "Risk Assessment Report", period: "February 2026", generated: "Feb 10, 2026", type: "PDF" },
  { name: "Audit Trail Export", period: "Last 90 days", generated: "Feb 12, 2026", type: "CSV" },
];

const filterOptions = ["All", "PDF", "Excel", "CSV"];

export default function Reports() {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const { toast } = useToast();

  const filteredReports = activeFilter === "All" ? reports : reports.filter(r => r.type === activeFilter);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const newReport: Report = {
        name: "Custom Compliance Report",
        period: "February 2026",
        generated: "Feb 14, 2026",
        type: ["PDF", "Excel", "CSV"][Math.floor(Math.random() * 3)],
      };
      setReports(prev => [newReport, ...prev]);
      setGenerating(false);
      toast({ title: "Report generated", description: `${newReport.name} (${newReport.type}) is ready for download.` });
    }, 2000);
  };

  const handleDownload = (index: number, report: Report) => {
    setDownloading(index);
    setTimeout(() => {
      setDownloading(null);
      toast({ title: "Download started", description: `${report.name}.${report.type.toLowerCase()} is downloading.` });
    }, 1000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate and download compliance reports</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {generating ? "Generating..." : "Generate Report"}
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-sm font-medium text-foreground">All Reports ({filteredReports.length})</span>
          <div className="relative">
            <button onClick={() => setShowFilter(!showFilter)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Filter className="h-3.5 w-3.5" /> {activeFilter === "All" ? "Filter" : activeFilter}
            </button>
            <AnimatePresence>
              {showFilter && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-7 z-10 w-32 rounded-lg border border-border bg-card p-1 shadow-xl"
                >
                  {filterOptions.map(f => (
                    <button
                      key={f}
                      onClick={() => { setActiveFilter(f); setShowFilter(false); }}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors ${activeFilter === f ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"}`}
                    >
                      {activeFilter === f && <Check className="h-3 w-3" />} {f}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="divide-y divide-border">
          {filteredReports.map((r, i) => (
            <motion.div
              key={`${r.name}-${r.generated}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileBarChart className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.period} · Generated {r.generated}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{r.type}</span>
                <button
                  onClick={() => handleDownload(i, r)}
                  disabled={downloading === i}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  {downloading === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
