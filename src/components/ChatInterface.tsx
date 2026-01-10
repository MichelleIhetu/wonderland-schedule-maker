import { useState, useRef, useEffect } from "react";
import { ChatMessage, UserSettings, themeColors } from "@/types/schedule";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Sparkles, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  settings: UserSettings;
}

export default function ChatInterface({ 
  messages, 
  isLoading, 
  onSendMessage, 
  onClearChat,
  settings 
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatContent = (content: string) => {
    // Remove schedule tags from display
    return content.replace(/<schedule>[\s\S]*?<\/schedule>/g, "✨ *Schedule generated!*");
  };

  const themeColor = themeColors[settings.theme];

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: themeColor.secondary }}
            >
              <Sparkles className="w-8 h-8" style={{ color: themeColor.primary }} />
            </div>
            <h2 className="font-display text-2xl mb-2">Welcome to Wonderland!</h2>
            <p className="font-body text-muted-foreground max-w-md mx-auto">
              Tell me about your tasks, goals, and what you need to accomplish today. 
              I'll create a personalized schedule just for you!
            </p>
            <div className="mt-6 space-y-2 text-sm text-muted-foreground font-body">
              <p>Try saying:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "I have an exam tomorrow",
                  "Need to finish my essay",
                  "Grocery shopping and gym",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "rounded-br-md"
                      : "rounded-bl-md bg-card border border-border"
                  }`}
                  style={
                    message.role === "user"
                      ? { backgroundColor: themeColor.primary, color: themeColor.secondary }
                      : undefined
                  }
                >
                  <p className="font-body text-sm whitespace-pre-wrap">
                    {formatContent(message.content)}
                  </p>
                  {message.content && !message.content.trim() && isLoading && message.role === "assistant" && (
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-current animate-pulse delay-100" />
                      <span className="w-2 h-2 rounded-full bg-current animate-pulse delay-200" />
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4 bg-card/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me about your tasks, goals, or what you need to do..."
              className="min-h-[60px] max-h-[120px] resize-none pr-12 font-body"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-10"
              style={{ backgroundColor: themeColor.primary }}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
            {messages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onClearChat}
                className="h-10"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
