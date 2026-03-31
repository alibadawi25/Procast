import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Check, ChevronDown, Copy, Layers, Search, Send, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  'Explain last forecast',
  'Why did sales spike?',
  'Compare sales groups',
  'Show accuracy trends',
];

const initialMessage: Message = {
  id: '0',
  role: 'assistant',
  content:
    "Hello! I'm ProAsk, your AI forecasting assistant. I can help you understand your forecasts, analyze sales trends, and compare different sales groups. What would you like to know?",
  timestamp: new Date(),
};

export function ProAsk() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedContext, setSelectedContext] = useState('all');
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [contextQuery, setContextQuery] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const contextRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isContextOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!contextRef.current || !(event.target instanceof Node)) return;
      if (!contextRef.current.contains(event.target)) {
        setIsContextOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isContextOpen]);

  const handleSend = async (content?: string) => {
    const messageText = (content ?? input).trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/proask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: messageText,
          context: selectedContext === 'all' ? undefined : selectedContext,
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorPayload?.detail || 'ProAsk request failed. Please try again.');
      }

      const data = (await response.json()) as { reply?: string };
      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content:
          typeof data.reply === 'string' && data.reply.trim()
            ? data.reply
            : 'I could not generate a response right now. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage: Message = {
        id: `${Date.now()}-assistant-error`,
        role: 'assistant',
        content: `I couldn't process your request right now. ${
          error instanceof Error ? error.message : 'Please try again.'
        }`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handleCopy = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message.id);
      setTimeout(() => setCopiedMessageId(null), 1200);
    } catch {
      // ignore clipboard errors
    }
  };

  const contextOptions = [
    { value: 'all', label: 'All sales groups' },
    { value: 'apm-1l', label: 'APM 1L' },
    { value: 'apm-1-5l', label: 'APM 1.5L' },
    { value: 'bpm-1l', label: 'BPM 1L' },
    { value: 'amj-ms-1l', label: 'AMJ MS 1L' },
    { value: 'bj-ms-1l', label: 'BJ MS 1L' },
    { value: 'almarai-butter', label: 'Al Marai Butter 500gm' },
  ];

  const selectedContextLabel =
    contextOptions.find((option) => option.value === selectedContext)?.label ?? 'All sales groups';
  const filteredContexts = contextOptions.filter((option) =>
    option.label.toLowerCase().includes(contextQuery.trim().toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1>ProAsk</h1>
          <p className="text-muted-foreground mt-1">Your AI-powered forecasting assistant</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <span className="text-xs text-muted-foreground">Context</span>
          <div ref={contextRef} className="relative w-full sm:w-60">
            <Button
              variant="default"
              className="w-full justify-between gap-3 px-4"
              aria-expanded={isContextOpen}
              onClick={() => setIsContextOpen((prev) => !prev)}
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                <Layers size={16} />
                {selectedContextLabel}
              </span>
              <ChevronDown size={16} className="opacity-70" />
            </Button>
            {isContextOpen && (
              <div className="absolute right-0 z-50 mt-2 w-full rounded-lg border bg-popover text-popover-foreground shadow-lg">
                <div className="border-b p-2">
                  <div className="flex items-center gap-2 rounded-md border bg-background px-2">
                    <Search size={14} className="text-muted-foreground" />
                    <input
                      value={contextQuery}
                      onChange={(e) => setContextQuery(e.target.value)}
                      placeholder="Search sales groups..."
                      className="h-8 w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto p-1">
                  {filteredContexts.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No sales groups found.</div>
                  ) : (
                    filteredContexts.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSelectedContext(option.value);
                          setIsContextOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        <span>{option.label}</span>
                        {selectedContext === option.value && <Check size={16} className="text-primary" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => {
            const previousMessage = messages[index - 1];
            const showAssistantHeader =
              message.role === 'assistant' && previousMessage?.role !== 'assistant';
            return (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`group relative max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {showAssistantHeader && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-accent text-accent-foreground rounded-full p-1">
                        <Sparkles size={14} />
                      </div>
                      <span className="text-xs font-medium">ProAsk</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(message)}
                    className={`absolute right-2 top-2 hidden items-center gap-1 rounded-md border px-2 py-1 text-[11px] shadow-sm transition ${
                      message.role === 'user'
                        ? 'border-primary-foreground/20 text-primary-foreground/80 hover:bg-primary-foreground/10'
                        : 'border-border text-muted-foreground hover:bg-background'
                    } group-hover:flex`}
                  >
                    <Copy size={12} />
                    {copiedMessageId === message.id ? 'Copied' : 'Copy'}
                  </button>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-accent text-accent-foreground rounded-full p-1">
                    <Sparkles size={14} />
                  </div>
                  <span className="text-xs font-medium">ProAsk</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground animate-pulse">ProAsk is thinking</span>
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <p className="text-sm text-muted-foreground mb-3">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void handleSend(prompt);
                  }}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t p-4">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Ask about forecasts, sales trends, or data..."
              className="flex-1 px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              onClick={() => {
                void handleSend();
              }}
              className="gap-2 px-6 h-full flex items-center transform transition-transform duration-200 hover:scale-105 hover:bg-primary/90"
            >
              <Send size={16} />
              Send
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
