import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SUGGESTED_QUESTIONS, getAssistantReply } from "@/lib/assistant";
import type { Tender } from "@/lib/mock-data";

type Msg = { id: string; role: "user" | "assistant"; text: string };

export function AssistantPanel({ tender }: { tender: Tender }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Contexte de conversation propre à chaque dossier
  useEffect(() => {
    setMessages([
      {
        id: "intro",
        role: "assistant",
        text: `Bonjour, je suis l'assistant Sophiaco dédié au dossier ${tender.ref} (${tender.client}). Posez-moi une question sur ce marché.`,
      },
    ]);
    setInput("");
    setTyping(false);
  }, [tender.id, tender.ref, tender.client]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q || typing) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: q }]);
    setInput("");
    setTyping(true);
    const delay = 800 + Math.random() * 400;
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: getAssistantReply(q, tender) },
      ]);
      setTyping(false);
    }, delay);
  };

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -2 }}
        onClick={() => setOpen(true)}
        className="pulse-accent fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full gradient-brand px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg"
      >
        <Sparkles className="h-4 w-4" />
        Demander à l'assistant IA
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[55] bg-charcoal/20 backdrop-blur-[2px]"
            />
            <motion.aside
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed right-0 top-0 z-[60] flex h-full w-full max-w-[400px] flex-col border-l border-border bg-background shadow-2xl"
            >
              <header className="flex items-center gap-3 border-b border-border px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full gradient-brand">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold">
                    Assistant — {tender.ref}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{tender.client}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </header>

              <div className="scroll-brand flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={m.role === "user" ? "flex justify-end" : "flex items-start gap-2"}
                  >
                    {m.role === "assistant" && (
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                        <Bot className="h-3.5 w-3.5 text-accent" />
                      </span>
                    )}
                    <div
                      className={
                        m.role === "user"
                          ? "max-w-[80%] whitespace-pre-line rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground"
                          : "max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2.5 text-sm"
                      }
                    >
                      {m.text}
                    </div>
                  </motion.div>
                ))}

                {messages.length <= 1 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {SUGGESTED_QUESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => ask(s)}
                        className="rounded-full border border-accent/30 bg-accent-soft/60 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-accent-soft"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {typing && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft">
                      <Bot className="h-3.5 w-3.5 text-accent" />
                    </span>
                    L'assistant écrit
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="h-1.5 w-1.5 rounded-full bg-accent"
                      />
                    ))}
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ask(input);
                }}
                className="flex items-center gap-2 border-t border-border p-3"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez votre question…"
                />
                <Button type="submit" size="icon" disabled={!input.trim() || typing}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
