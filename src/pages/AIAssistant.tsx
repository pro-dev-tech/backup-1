import { useState, useRef, useEffect } from "react";
import { Bot, Send, Download, Sparkles, AlertTriangle, CheckCircle, Trash2, WifiOff, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/contexts/ChatContext";
import { renderMarkdown } from "@/lib/markdown";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognitionAPI = typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

const examplePrompts = [
  "When is my next GST filing deadline?",
  "Show my overdue compliance items",
  "What's my current risk score?",
  "Summarize my compliance status",
];

export default function AIAssistant() {
  const { messages, sendMessage, clearChat, isTyping, backendAvailable } = useChat();
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = (text: string) => {
    if (!text.trim() || isTyping) return;
    setInput("");
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
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

    recognition.onresult = (event: { results: { [x: string]: { [x: string]: { transcript: string } } }; resultIndex: number }) => {
      let transcript = "";
      for (let i = 0; i < Object.keys(event.results).length; i++) {
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
                <div
                  className="text-sm leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1 [&_pre]:my-2 [&_li]:my-0.5 [&_a]:text-primary [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
                {msg.isStreaming && (
                  <motion.span
                    className="inline-block w-2 h-4 bg-primary ml-0.5"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}

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

        {isTyping && !messages.some(m => m.isStreaming) && (
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
            onClick={() => handleSend(p)}
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
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
          placeholder="Ask about any compliance requirement..."
          className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        {SpeechRecognitionAPI && (
          <button
            onClick={toggleVoice}
            className={`rounded-xl px-3 py-3 transition-all ${
              listening
                ? "bg-destructive/10 text-destructive border border-destructive/30 animate-pulse"
                : "border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            title={listening ? "Stop listening" : "Voice input"}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        )}
        <button
          onClick={() => handleSend(input)}
          disabled={isTyping}
          className="rounded-xl gradient-primary px-4 py-3 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
