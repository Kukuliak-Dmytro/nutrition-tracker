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
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIToolCard } from "./AIToolCard";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

function AIThoughtBlock({ content }: { content: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const clean = content.replace(/<think>|<\/think>/g, "").trim();
  if (!clean) return null;

  return (
    <div className="w-full my-1 rounded-xl border border-border/60 bg-muted/20 overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors text-left text-xs font-medium cursor-pointer">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary/70" />
          <span>Хід думок асистента</span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="px-3 py-2 border-t border-border/30 bg-background/50 font-mono text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto">
          {clean}
        </div>
      )}
    </div>
  );
}

const markdownComponents = {
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-2 w-full overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full text-left text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-muted/80 border-b border-border/60">{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody className="divide-y divide-border/40">{children}</tbody>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="hover:bg-muted/40 transition-colors">{children}</tr>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-2.5 py-1.5 font-semibold text-foreground text-xs whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-2.5 py-1.5 text-foreground/90 whitespace-nowrap text-xs">
      {children}
    </td>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="my-1.5 space-y-1 pl-4 list-disc marker:text-primary text-sm">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="my-1.5 space-y-1 pl-4 list-decimal marker:text-primary text-sm">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm leading-relaxed">{children}</li>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="font-semibold text-base mt-2 mb-1 text-foreground">{children}</h3>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="font-semibold text-sm mt-2 mb-1 text-foreground">{children}</h3>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="font-semibold text-sm mt-2 mb-1 text-foreground">{children}</h3>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">
      {children}
    </code>
  ),
};

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

  return (
    <aside
      className={
        isOpen
          ? "fixed inset-0 z-50 flex flex-col bg-background w-full h-[100dvh] animate-in slide-in-from-top duration-300 lg:static lg:inset-auto lg:z-20 lg:h-full lg:w-[400px] xl:w-[440px] lg:border-l lg:border-border lg:bg-background lg:animate-none lg:shadow-none lg:shrink-0"
          : "hidden"
      }
      aria-label="AI Food Assistant">
        {/* Header */}
        <header className="shrink-0 flex items-center justify-between border-b border-border/80 px-4 py-3.5 bg-muted/20">
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
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 text-sm">
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

                  <div className={`space-y-1.5 ${isUser ? "max-w-[85%] items-end" : "flex-1 min-w-0 items-start"}`}>
                    {/* Render message parts */}
                    {message.parts.map((part, pIdx) => {
                      if (part.type === "reasoning") {
                        const reasoningText =
                          (part as { reasoning?: string; text?: string }).reasoning ||
                          (part as { text?: string }).text ||
                          "";
                        return <AIThoughtBlock key={pIdx} content={reasoningText} />;
                      }

                      if (part.type === "text") {
                        if (!part.text) return null;
                        const trimmed = part.text.trim();
                        if (trimmed.startsWith('{"name":') && trimmed.includes('"arguments":')) {
                          return null;
                        }

                        // Pre-tool reasoning: if this text part is followed by a tool call later in parts
                        const isIntermediateThought =
                          !isUser &&
                          message.parts
                            .slice(pIdx + 1)
                            .some((p) => isToolUIPart(p) || p.type === "reasoning");

                        // If text is enclosed in <think> tags
                        if (!isUser && trimmed.includes("<think>")) {
                          const thinkMatch = trimmed.match(/<think>([\s\S]*?)<\/think>/);
                          const thinkContent = thinkMatch ? thinkMatch[1].trim() : "";
                          const remainingText = trimmed.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

                          return (
                            <React.Fragment key={pIdx}>
                              {thinkContent && <AIThoughtBlock content={thinkContent} />}
                              {remainingText && (
                                <div className="rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-xs overflow-hidden bg-muted/70 text-foreground border border-border/50 rounded-bl-xs w-full">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                    {remainingText}
                                  </ReactMarkdown>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        }

                        if (isIntermediateThought) {
                          return <AIThoughtBlock key={pIdx} content={part.text} />;
                        }

                        return (
                          <div
                            key={pIdx}
                            className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-xs overflow-hidden ${
                              isUser
                                ? "bg-primary text-primary-foreground rounded-br-xs whitespace-pre-wrap ml-auto"
                                : "bg-muted/70 text-foreground border border-border/50 rounded-bl-xs w-full"
                            }`}>
                            {isUser ? (
                              part.text
                            ) : (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}>
                                {part.text}
                              </ReactMarkdown>
                            )}
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
                        // Skip rendering duplicate consecutive badges
                        if (toolPart.output && toolPart.output.isDuplicateConsecutive) {
                          return null;
                        }
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
        <footer className="shrink-0 border-t border-border/80 p-3 bg-card/60 backdrop-blur-md">
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
    );
  }
