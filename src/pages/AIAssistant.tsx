import { useState, useRef, useEffect } from "react";
import { Bot, Send, Download, Sparkles, AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

interface Message {
  role: "user" | "ai";
  content: string;
  risks?: string[];
  actions?: string[];
}

const examplePrompts = [
  "Explain new GST amendment",
  "Draft reply to ROC notice",
  "What compliances apply to 35 employees in Karnataka?",
  "Summarize PF compliance changes for 2026",
];

const initialMessages: Message[] = [
  {
    role: "ai",
    content: "Hello! I'm your AI Compliance Assistant. I can help you understand regulations, draft responses, and identify applicable compliances for your MSME. How can I help you today?",
  },
];

// Fallback mock responses (used when backend is unavailable)
function getMockResponse(text: string): Message {
  const lower = text.toLowerCase();
  if (lower.includes("gst")) {
    return {
      role: "ai",
      content: "The latest GST amendment (Notification No. 12/2026) introduces simplified return filing for MSMEs with turnover below ₹5 Cr. Key changes include:\n\n1. **Quarterly GSTR-3B** filing instead of monthly\n2. **Auto-populated GSTR-2A** for input tax credit\n3. **Reduced late fees** from ₹50/day to ₹20/day\n\nEffective from April 1, 2026. Your company qualifies for these simplified provisions.",
      risks: ["Late filing penalty: ₹20/day under new rules", "Input credit mismatch risk if vendors don't file"],
      actions: ["Opt-in for quarterly filing on GST portal", "Verify vendor compliance", "Update accounting software"],
    };
  }
  if (lower.includes("karnataka") || lower.includes("employee")) {
    return {
      role: "ai",
      content: "For a company with 35 employees operating in Karnataka, the following compliances are applicable:\n\n1. **Provident Fund (PF)** — Mandatory (>20 employees)\n2. **ESIC** — Applicable for employees earning ≤₹21,000/month\n3. **Professional Tax** — Karnataka-specific, monthly deduction\n4. **Shops & Establishment Act** — Karnataka State registration\n5. **GST** — Based on turnover threshold\n6. **Labour Welfare Fund** — Annual contribution",
      risks: ["PF Return overdue — ₹5,000/day penalty risk", "ESIC threshold change may affect 8 employees"],
      actions: ["File PF Return immediately", "Review ESIC applicability", "Schedule GST-3B preparation"],
    };
  }
  return {
    role: "ai",
    content: "Based on your company profile and current regulatory landscape, here's my analysis:\n\n**Current Status:** Your compliance score is 82/100, which is above the industry average of 74.\n\n**Key Recommendations:**\n1. Address the overdue PF return immediately to avoid penalties\n2. Review the new ESIC threshold changes for Karnataka\n3. Prepare for upcoming GST-3B filing deadline on Feb 20",
    risks: ["PF Return overdue — ₹5,000/day penalty risk", "ESIC threshold change may affect 8 employees"],
    actions: ["File PF Return immediately", "Review ESIC applicability", "Schedule GST-3B preparation"],
  };
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Load chat history from backend on mount
  useEffect(() => {
    api.get<Message[]>("/ai/history")
      .then(res => {
        if (res.success && res.data && res.data.length > 0) {
          setMessages(res.data.map(m => ({ role: m.role, content: m.content, risks: m.risks, actions: m.actions })));
        }
      })
      .catch(() => {});
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
        setMessages(prev => [...prev, {
          role: "ai",
          content: res.data.content,
          risks: res.data.risks,
          actions: res.data.actions,
        }]);
      } else {
        throw new Error("No response");
      }
    } catch {
      // Fallback to mock if backend is unavailable
      await new Promise(r => setTimeout(r, 1000));
      setMessages(prev => [...prev, getMockResponse(text)]);
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
        <button
          onClick={clearChat}
          className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Clear chat history"
        >
          <Trash2 className="h-4 w-4" />
        </button>
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
                  : "glass-card"
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed" dangerouslySetInnerHTML={{
                  __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
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
