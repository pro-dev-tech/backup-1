import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Mic, MicOff, Trash2, Sparkles, AlertTriangle, CheckCircle, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/contexts/ChatContext";
import { renderMarkdown } from "@/lib/markdown";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognitionAPI = typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

export default function FloatingAIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const { messages, sendMessage, clearChat, isTyping, backendAvailable } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSend = (text: string) => {
    if (!text.trim() || isTyping) return;
    setInput("");
    sendMessage(text);
  };

  const toggleVoice = () => {
    if (!SpeechRecognitionAPI) return;

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <>
      {/* Floating Icon */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full gradient-primary shadow-lg flex items-center justify-center group"
            style={{ boxShadow: "0 4px 24px hsl(220 90% 56% / 0.35)" }}
          >
            <Bot className="h-6 w-6 text-primary-foreground" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success animate-pulse border-2 border-background" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mini Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[370px] h-[520px] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden"
            style={{ boxShadow: "0 8px 40px hsl(222 20% 4% / 0.5)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border gradient-primary">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary-foreground" />
                <span className="text-sm font-semibold text-primary-foreground">AI Assistant</span>
                {backendAvailable === true && (
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={clearChat} className="p-1.5 rounded-lg text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors" title="Clear chat">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                    msg.role === "user"
                      ? "gradient-primary text-primary-foreground"
                      : msg.isError
                        ? "border border-destructive/30 bg-destructive/5"
                        : "bg-secondary border border-border"
                  }`}>
                    <div
                      className="leading-relaxed [&_h2]:text-sm [&_h3]:text-xs [&_h4]:text-xs [&_pre]:text-[10px] [&_code]:text-[10px] [&_li]:text-xs"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />

                    {msg.risks && msg.risks.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border space-y-1">
                        <p className="text-[10px] font-semibold text-destructive flex items-center gap-1"><AlertTriangle className="h-2.5 w-2.5" /> Risks</p>
                        {msg.risks.map((r, j) => <p key={j} className="text-[10px] text-muted-foreground pl-3">• {r}</p>)}
                      </div>
                    )}

                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border space-y-1">
                        <p className="text-[10px] font-semibold text-success flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5" /> Actions</p>
                        {msg.actions.map((a, j) => <p key={j} className="text-[10px] text-muted-foreground pl-3">• {a}</p>)}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-1 px-3 py-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-2">
              <div className="flex gap-1.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                  placeholder="Ask anything..."
                  className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  onClick={toggleVoice}
                  className={`rounded-lg p-2 transition-colors ${
                    listening
                      ? "bg-destructive/10 text-destructive border border-destructive/30"
                      : "border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                  title={listening ? "Stop listening" : "Voice input"}
                >
                  {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => handleSend(input)}
                  disabled={isTyping}
                  className="rounded-lg gradient-primary p-2 text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
