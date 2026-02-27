import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getChatMessages, addChatMessage, clearChatMessages } from "@/lib/firestore";

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

// Express AI server URL – change this to your deployed Express server URL
const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || "http://localhost:5000";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const streamingTextRef = useRef("");

  // Load chat history from Firestore
  useEffect(() => {
    if (!firebaseUser) {
      setMessages(initialMessages);
      return;
    }
    getChatMessages(firebaseUser.uid)
      .then(docs => {
        if (docs.length > 0) {
          setMessages(docs.map((d: any) => ({
            role: d.role,
            content: d.content,
            risks: d.risks,
            actions: d.actions,
          })));
        }
      })
      .catch(() => {});
  }, [firebaseUser]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    streamingTextRef.current = "";

    // Save user message to Firestore
    if (firebaseUser) {
      addChatMessage(firebaseUser.uid, { role: "user", content: text }).catch(() => {});
    }

    try {
      const response = await fetch(`${AI_SERVER_URL}/api/ai/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !response.body || !contentType.includes("text/event-stream")) {
        throw new Error("Stream not available");
      }

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
                    updated[i] = { ...updated[i], content: `⚠️ **AI service unavailable.**\n\n${parsed.error}`, isStreaming: false, isError: true };
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

      // Finalize streaming
      setMessages(prev => {
        const finalized = prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m);
        // Save AI response to Firestore
        const lastAi = finalized[finalized.length - 1];
        if (lastAi?.role === "ai" && firebaseUser) {
          addChatMessage(firebaseUser.uid, {
            role: "ai",
            content: lastAi.content,
            risks: lastAi.risks || [],
            actions: lastAi.actions || [],
          }).catch(() => {});
        }
        return finalized;
      });
      setBackendAvailable(true);
    } catch {
      // Fallback: non-streaming
      try {
        const res = await fetch(`${AI_SERVER_URL}/api/ai/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setBackendAvailable(true);
          const aiMsg: Message = { role: "ai", content: json.data.content, risks: json.data.risks, actions: json.data.actions };
          setMessages(prev => [...prev, aiMsg]);
          if (firebaseUser) {
            addChatMessage(firebaseUser.uid, { role: "ai", content: json.data.content, risks: json.data.risks || [], actions: json.data.actions || [] }).catch(() => {});
          }
        } else {
          throw new Error(json.error || "No response");
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setBackendAvailable(false);
        setMessages(prev => [...prev, {
          role: "ai",
          content: `⚠️ **AI service unavailable.**\n\n${errorMessage}\n\nEnsure the Express server is running:\n\`cd server && npm run dev\``,
          isError: true,
        }]);
      }
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, firebaseUser]);

  const clearChat = useCallback(async () => {
    setMessages(initialMessages);
    if (firebaseUser) {
      clearChatMessages(firebaseUser.uid).catch(() => {});
    }
  }, [firebaseUser]);

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
