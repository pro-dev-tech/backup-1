import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, ExternalLink, X, Sparkles, Power, Clock, Tag, AlertTriangle, Shield, WifiOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";

interface Article {
  id: number;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  impactLevel: "Low" | "Medium" | "High";
  summary: string;
  details: string;
}

const impactConfig = {
  High: { class: "status-red", icon: AlertTriangle },
  Medium: { class: "status-yellow", icon: Shield },
  Low: { class: "status-green", icon: Shield },
};

const categoryColors: Record<string, string> = {
  GST: "bg-primary/15 text-primary",
  MCA: "bg-accent/15 text-accent",
  Labour: "bg-warning/15 text-warning",
  SEBI: "bg-destructive/15 text-destructive",
  Environmental: "bg-success/15 text-success",
  Financial: "bg-primary/15 text-primary",
  General: "bg-secondary text-secondary-foreground",
  Tax: "bg-accent/15 text-accent",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function RegulatoryNewsFeed() {
  const [enabled, setEnabled] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch from backend when enabled
  useEffect(() => {
    if (!enabled) {
      setArticles([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const query = filter !== "All" ? `?category=${encodeURIComponent(filter)}` : "";
    api.get<Article[]>(`/news${query}`)
      .then(res => {
        if (res.success && res.data && res.data.length > 0) {
          setArticles(res.data);
          setError(null);
        } else {
          setArticles([]);
          setError("No news articles found. The Event Registry API may not have returned results for the current filters.");
        }
      })
      .catch((err: unknown) => {
        setArticles([]);
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(`News service is currently unavailable. ${msg}`);
      })
      .finally(() => setLoading(false));
  }, [enabled, filter]);

  const categories = ["All", ...Array.from(new Set(articles.map(a => a.category)))];
  const filtered = filter === "All" ? articles : articles.filter(a => a.category === filter);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" />
            Regulatory News Feed
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with the latest Indian regulatory changes affecting your business
          </p>
        </div>
        <div className="flex items-center gap-3 glass-card px-4 py-3 rounded-xl">
          <div className="flex items-center gap-2">
            <Power className={`h-4 w-4 ${enabled ? "text-success" : "text-muted-foreground"}`} />
            <span className="text-sm font-medium text-foreground">Live Feed</span>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          {enabled && !error && articles.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] text-success font-semibold">LIVE</span>
            </span>
          )}
          {enabled && error && (
            <span className="flex items-center gap-1.5">
              <WifiOff className="h-3 w-3 text-destructive" />
              <span className="text-[10px] text-destructive font-semibold">OFFLINE</span>
            </span>
          )}
        </div>
      </motion.div>

      {/* Disabled state */}
      {!enabled && (
        <motion.div variants={item} className="glass-card p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Newspaper className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Regulatory News Feed is currently turned off</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Enable the toggle above to receive real-time Indian compliance law updates, GST amendments, MCA notifications, and more.
          </p>
        </motion.div>
      )}

      {/* Enabled state */}
      {enabled && (
        <>
          {/* Error state */}
          {error && !loading && (
            <motion.div variants={item} className="glass-card p-8 text-center border border-destructive/20 bg-destructive/5">
              <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <WifiOff className="h-7 w-7 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">News Service Unavailable</h3>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-4">{error}</p>
              <p className="text-xs text-muted-foreground">
                Ensure the backend server is running: <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">cd server && npm run dev</code>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                And that <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">EVENTREGISTRY_API_KEY</code> is set in <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">server/.env</code>
              </p>
            </motion.div>
          )}

          {/* Category filter — only show when we have articles */}
          {articles.length > 0 && (
            <motion.div variants={item} className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filter === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Fetching live regulatory news...</p>
            </div>
          )}

          {/* Articles grid */}
          {!loading && !error && articles.length > 0 && (
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map(article => {
                const impact = impactConfig[article.impactLevel] || impactConfig.Low;
                return (
                  <motion.div
                    key={article.id}
                    variants={item}
                    onClick={() => setSelectedArticle(article)}
                    className="glass-card-hover p-5 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {article.title}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{article.summary}</p>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryColors[article.category] || "bg-secondary text-secondary-foreground"}`}>
                        {article.category}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${impact.class}`}>
                        {article.impactLevel} Impact
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {timeAgo(article.publishedAt)}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{article.source}</span>
                      <span className="text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Click for details →
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-lg p-6 relative max-h-[85vh] overflow-y-auto scrollbar-thin"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${categoryColors[selectedArticle.category] || "bg-secondary text-secondary-foreground"}`}>
                  {selectedArticle.category}
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${(impactConfig[selectedArticle.impactLevel] || impactConfig.Low).class}`}>
                  {selectedArticle.impactLevel} Impact
                </span>
              </div>

              <h2 className="text-lg font-bold text-foreground mb-2 leading-snug">{selectedArticle.title}</h2>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5">
                <span>{selectedArticle.source}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(selectedArticle.publishedAt)}
                </span>
              </div>

              <div className="rounded-lg bg-secondary/50 p-4 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">AI Summary</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedArticle.summary}</p>
              </div>

              <div className="mb-5">
                <h4 className="text-sm font-semibold text-foreground mb-2">Full Details</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedArticle.details}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Full Article
                </a>
                <button className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary text-foreground py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                  <Tag className="h-4 w-4" />
                  Talk to Expert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
