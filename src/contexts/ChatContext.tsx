import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface Message {
  role: "user" | "ai";
  content: string;
  risks?: string[];
  actions?: string[];
  isError?: boolean;
  isStreaming?: boolean;
}

interface ChatContextType {
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => Promise<void>;
  isTyping: boolean;
  backendAvailable: boolean | null;
}

const ChatContext = createContext<ChatContextType | null>(null);

const initialMessages: Message[] = [
  {
    role: "ai",
    content: "Hello! I'm your AI Compliance Assistant. I can help you understand regulations, draft responses, and identify applicable compliances for your MSME. How can I help you today?",
  },
];

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const streamingTextRef = useRef("");

  useEffect(() => {
    api.get<Message[]>("/ai/history")
      .then(res => {
        setBackendAvailable(true);
        if (res.success && res.data && res.data.length > 0) {
          setMessages(res.data.map(m => ({ role: m.role, content: m.content, risks: m.risks, actions: m.actions })));
        }
      })
      .catch(() => setBackendAvailable(false));
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    streamingTextRef.current = "";

    try {
      const token = localStorage.getItem("cai_auth_token");
      const response = await fetch("/api/ai/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: text }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !response.body || !contentType.includes("text/event-stream")) {
        throw new Error("Stream not available");
      }

      // Add empty streaming AI message
      setMessages(prev => [...prev, { role: "ai", content: "", isStreaming: true }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.error) {
              setMessages(prev => {
                const updated = [...prev];
                for (let i = updated.length - 1; i >= 0; i--) {
                  if (updated[i].isStreaming) {
                    updated[i] = {
                      ...updated[i],
                      content: `⚠️ **AI service is currently unavailable.**\n\n${parsed.error}`,
                      isStreaming: false,
                      isError: true,
                    };
                    break;
                  }
                }
                return updated;
              });
              setBackendAvailable(false);
              continue;
            }

            if (parsed.word !== undefined) {
              streamingTextRef.current += parsed.word;
              const currentText = streamingTextRef.current;
              setMessages(prev => {
                const updated = [...prev];
                for (let i = updated.length - 1; i >= 0; i--) {
                  if (updated[i].isStreaming) {
                    updated[i] = { ...updated[i], content: currentText };
                    break;
                  }
                }
                return updated;
              });
            }

            if (parsed.risks || parsed.actions) {
              setMessages(prev => {
                const updated = [...prev];
                for (let i = updated.length - 1; i >= 0; i--) {
                  if (updated[i].isStreaming) {
                    updated[i] = { ...updated[i], risks: parsed.risks, actions: parsed.actions, isStreaming: false };
                    break;
                  }
                }
                return updated;
              });
            }
          } catch {}
        }
      }

      // Finalize any still-streaming message
      setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m));
      setBackendAvailable(true);
    } catch {
      // Fallback to non-streaming
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
          throw new Error(res.error || "No response");
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setBackendAvailable(false);
        setMessages(prev => [...prev, {
          role: "ai",
          content: `⚠️ **AI service is currently unavailable.**\n\n${errorMessage}\n\nPlease ensure the backend server is running:\n\`cd server && npm run dev\``,
          isError: true,
        }]);
      }
    } finally {
      setIsTyping(false);
    }
  }, [isTyping]);

  const clearChat = useCallback(async () => {
    setMessages(initialMessages);
    api.delete("/ai/history").catch(() => {});
  }, []);

  return (
    <ChatContext.Provider value={{ messages, sendMessage, clearChat, isTyping, backendAvailable }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
