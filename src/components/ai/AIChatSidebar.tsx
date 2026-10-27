"use client";

import React, { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart } from "ai";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  X,
  Send,
  Square,
  RotateCcw,
  Bot,
  User as UserIcon,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIToolCard } from "./AIToolCard";

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  { label: "🥘 Що є в наявності?", prompt: "Що в мене ще лишилося з їжі?" },
  { label: "🍳 Сніданок", prompt: "З'їв на сніданок 2 варені яйця та тост із сиром 30г" },
  { label: "🍗 Обід", prompt: "З'їв на обід 200г вареної гречки та 150г запеченого курячого філе" },
  { label: "🍎 Перекус", prompt: "З'їв 1 середнє яблуко та випив капучино 250мл" },
  { label: "📊 Що з'їв?", prompt: "Що я сьогодні вже з'їв і скільки там калорій?" },
];

export function AIChatSidebar({ isOpen, onClose }: AIChatSidebarProps) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const {
    messages,
    sendMessage,
    status,
    stop,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: {
        sessionId,
        currentDate: new Date().toISOString().split("T")[0],
        currentTime: `${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, "0")}`,
      },
    }),
    onFinish: () => {
      // Invalidate React Query caches so food logs, totals, and deficit banners update instantly
      queryClient.invalidateQueries({ queryKey: ["foodLog"] });
      queryClient.invalidateQueries({ queryKey: ["foodLogSummary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const isGenerating = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isGenerating) return;
    setInput("");
    await sendMessage({ text: trimmed });
  };

  const handleResetChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right Sidebar Sheet */}
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-background shadow-2xl sm:w-[460px] md:w-[480px] animate-in slide-in-from-right duration-300"
        aria-label="AI Food Assistant">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border/80 px-4 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">AI Щоденник</h2>
                <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Qwen 2.5 3B Local
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Швидке логування їжі людською мовою</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetChat}
              title="Новий діалог"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Закрити"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4 space-y-4 text-muted-foreground my-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bot className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">Чим можу допомогти?</h3>
                <p className="text-xs max-w-xs">
                  Просто напишіть, що ви з&apos;їли, і я автоматично розрахую КБЖВ та зроблю запис у базі даних.
                </p>
              </div>

              {/* Quick Prompt Pills */}
              <div className="w-full pt-4 space-y-2">
                <p className="text-[11px] font-medium text-muted-foreground/80 text-left">Швидкі приклади:</p>
                <div className="grid grid-cols-1 gap-1.5 text-left">
                  {QUICK_PROMPTS.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(qp.prompt)}
                      className="group flex items-center justify-between rounded-xl border border-border/70 bg-card p-2.5 text-xs text-foreground transition-all hover:border-primary/50 hover:bg-muted/40">
                      <span className="font-medium">{qp.label}</span>
                      <span className="text-[11px] text-muted-foreground truncate max-w-[240px] group-hover:text-foreground">
                        {qp.prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-1.5 ${isUser ? "items-end" : "items-start"}`}>
                    {/* Render message parts */}
                    {message.parts.map((part, pIdx) => {
                      if (part.type === "text") {
                        if (!part.text) return null;
                        return (
                          <div
                            key={pIdx}
                            className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                              isUser
                                ? "bg-primary text-primary-foreground rounded-br-xs"
                                : "bg-muted/70 text-foreground border border-border/50 rounded-bl-xs"
                            }`}>
                            <div className="whitespace-pre-wrap">{part.text}</div>
                          </div>
                        );
                      }

                      if (isToolUIPart(part)) {
                        const toolPart = part as {
                          toolName?: string;
                          type: string;
                          toolCallId?: string;
                          state?: string;
                          input?: Record<string, unknown>;
                          output?: Record<string, unknown>;
                        };
                        const toolName = toolPart.toolName || toolPart.type.replace("tool-", "");
                        return (
                          <AIToolCard
                            key={pIdx}
                            tool={{
                              toolName,
                              toolCallId: toolPart.toolCallId,
                              state: toolPart.state === "output-available" ? "result" : "call",
                              args: toolPart.input,
                              result: toolPart.output,
                            }}
                          />
                        );
                      }

                      return null;
                    })}
                  </div>

                  {isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground mt-0.5">
                      <UserIcon className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isGenerating && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground italic pl-9">
              <span className="flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
              </span>
              <span>Асистент аналізує та записує...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <footer className="border-t border-border/80 p-3 bg-card/60 backdrop-blur-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex flex-col gap-2">
            <div className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                rows={1}
                placeholder="«З'їв на обід 200г гречки та 150г філе...»"
                className="w-full resize-none rounded-xl border border-input bg-background/80 py-2.5 pl-3.5 pr-12 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/70"
              />

              <div className="absolute right-1.5">
                {isGenerating ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    onClick={stop}
                    className="h-8 w-8 rounded-lg shadow-xs"
                    title="Зупинити генерацію">
                    <Square className="h-3 w-3 fill-current" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim()}
                    className="h-8 w-8 rounded-lg shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-1 text-[10px] text-muted-foreground">
              <span>Enter — відправити, Shift+Enter — новий рядок</span>
              <span className="flex items-center gap-1 text-primary">
                <Zap className="h-3 w-3" /> Zero-Roundtrip Tooling
              </span>
            </div>
          </form>
        </footer>
      </aside>
    </>
  );
}
