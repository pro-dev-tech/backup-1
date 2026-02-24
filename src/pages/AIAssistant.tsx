import { useState, useRef, useEffect } from "react";
import { Bot, Send, Download, Sparkles, AlertTriangle, CheckCircle, Trash2, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

interface Message {
  role: "user" | "ai";
  content: string;
  risks?: string[];
  actions?: string[];
  isError?: boolean;
}

const examplePrompts = [
  "When is my next GST filing deadline?",
  "Show my overdue compliance items",
  "What's my current risk score?",
  "Summarize my compliance status",
];

const initialMessages: Message[] = [
  {
    role: "ai",
    content: "Hello! I'm your AI Compliance Assistant. I can help you understand regulations, draft responses, and identify applicable compliances for your MSME. How can I help you today?",
  },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Check backend & load chat history on mount
  useEffect(() => {
    api.get<Message[]>("/ai/history")
      .then(res => {
        setBackendAvailable(true);
        if (res.success && res.data && res.data.length > 0) {
          setMessages(res.data.map(m => ({ role: m.role, content: m.content, risks: m.risks, actions: m.actions })));
        }
      })
      .catch(() => {
        setBackendAvailable(false);
      });
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || typing) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const res = await api.post<Message>("/ai/message", { content: text });
      if (res.success && res.data) {
        setBackendAvailable(true);
        setMessages(prev => [...prev, {
          role: "ai",
          content: res.data.content,
          risks: res.data.risks,
          actions: res.data.actions,
        }]);
      } else {
        throw new Error(res.error || "No response from AI service");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setBackendAvailable(false);
      setMessages(prev => [...prev, {
        role: "ai",
        content: `⚠️ **AI service is currently unavailable.**\n\n${errorMessage}\n\nPlease ensure the backend server is running:\n\`cd server && npm run dev\`\n\nIf the server is running, check that your API keys (GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY) are properly configured in \`server/.env\`.`,
        isError: true,
      }]);
    } finally {
      setTyping(false);
    }
  };

  const clearChat = async () => {
    setMessages(initialMessages);
    api.delete("/ai/history").catch(() => {});
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/15 flex items-center justify-center">
            <Bot className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Compliance Assistant</h1>
            <p className="text-xs text-muted-foreground">Powered by regulatory intelligence engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {backendAvailable === false && (
            <span className="flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-[10px] font-semibold text-destructive">
              <WifiOff className="h-3 w-3" /> Backend Offline
            </span>
          )}
          {backendAvailable === true && (
            <span className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[10px] font-semibold text-success">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Connected
            </span>
          )}
          <button
            onClick={clearChat}
            className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Clear chat history"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 mb-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] rounded-xl p-4 text-sm ${
                msg.role === "user"
                  ? "gradient-primary text-primary-foreground"
                  : msg.isError
                    ? "border border-destructive/30 bg-destructive/5"
                    : "glass-card"
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed" dangerouslySetInnerHTML={{
                  __html: msg.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                    .replace(/`(.*?)`/g, '<code class="bg-secondary px-1 py-0.5 rounded text-xs">$1</code>')
                }} />

                {msg.risks && msg.risks.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                    <p className="text-xs font-semibold text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Risk Points</p>
                    {msg.risks.map((r, j) => (
                      <p key={j} className="text-xs text-muted-foreground pl-4">• {r}</p>
                    ))}
                  </div>
                )}

                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                    <p className="text-xs font-semibold text-success flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Suggested Actions</p>
                    {msg.actions.map((a, j) => (
                      <p key={j} className="text-xs text-muted-foreground pl-4">• {a}</p>
                    ))}
                    <button className="mt-2 flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors">
                      <Download className="h-3 w-3" /> Download Draft
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <div className="flex gap-1 px-4 py-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Prompt suggestions */}
      <div className="flex flex-wrap gap-2 mb-3">
        {examplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => sendMessage(p)}
            className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="h-3 w-3 text-primary" /> {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask about any compliance requirement..."
          className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={typing}
          className="rounded-xl gradient-primary px-4 py-3 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
