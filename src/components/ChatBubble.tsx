"use client";
import { getChatMessages, addChatMessage } from "@/lib/Chat";
import { MessageCircle, Send, X, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import Message from "./Message";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/user-context";

type ChatMessage = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_image: string | null;
  user_username: string;
  isTemp?: boolean;
  isFailed?: boolean;
};

const mergeMessages = (current: ChatMessage[], incoming: ChatMessage[]) => {
  const byId = new Map<string, ChatMessage>();
  current.forEach((msg) => byId.set(msg.id, msg));
  incoming.forEach((msg) => byId.set(msg.id, msg));

  return Array.from(byId.values()).sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)
  );
};

function ChatBubble() {
  const { session, user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Ref to auto-scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setError(null);

    const supabase = createClient();
    const channel = supabase
      .channel("public-chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const incoming = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.find((m) => m.id === incoming.id)) return prev;

            const filtered = prev.filter(
              (m) =>
                !(
                  m.isTemp &&
                  m.user_id === incoming.user_id &&
                  m.content === incoming.content
                )
            );

            return mergeMessages(filtered, [incoming]);
          });
        }
      )
      .subscribe();

    const fetchMessages = async () => {
      setIsLoading(true);
      const res = await getChatMessages();
      if (!isMounted) return;

      if (!res) {
        setError("Failed to load messages. Please try again.");
        setIsLoading(false);
        return;
      }

      setMessages((prev) => mergeMessages(prev, res));
      setIsLoading(false);
    };

    fetchMessages();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !user?.isdaa) return;
    if (!newMessage.trim()) return;

    // Clear any previous errors
    setError(null);
    setIsSending(true);

    // Optimistic Update (Show message immediately before DB confirms)
    const tempId = crypto.randomUUID();

    const tempMsg = {
      id: tempId,
      content: newMessage,
      created_at: new Date().toISOString(),
      user_id: session?.user.id,
      user_image: session.user.user_metadata?.avatar_url || "/assets/pdp.jpg",
      user_username: user.username,
      isTemp: true,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    // Send payload to server
    const res = await addChatMessage({ content: tempMsg.content });

    setIsSending(false);

    if (!res) {
      // Mark as failed and show error message
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, isFailed: true } : m))
      );
      setError("Failed to send message. Please try again.");
      return;
    }

    // Replace temp message with server-confirmed message if it still exists
    setMessages((prev) => {
      // If server message already appended by realtime, remove temp only
      const exists = prev.find((m) => m.id === res.id);
      if (exists) {
        return prev.filter((m) => m.id !== tempId);
      }

      return prev.map((m) => (m.id === tempId ? res : m));
    });
  };

  const renderedMessages = useMemo(() => {
    return messages.map((msg, index) => {
      const isLastInSequence =
        index === messages.length - 1 ||
        messages[index + 1].user_id !== msg.user_id;

      return (
        <Message
          key={msg.id}
          messageContent={msg.content}
          myMsg={msg.user_id === session?.user?.id}
          showAvatar={isLastInSequence}
          userId={msg.user_id}
          img={msg.user_image}
          username={msg.user_username}
          isFailed={msg.isFailed}
        />
      );
    });
  }, [messages, session?.user?.id]);

  if (!session || !user?.isdaa) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="mb-4 flex h-[500px] w-[min(90vw,350px)] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground">
            <div>
              <h3 className="font-bold text-lg">DAA Students Chat</h3>
              <p className="text-xs opacity-90">
                Be respectful. No personal information.
              </p>
            </div>
            <button
              type="button"
              title="close Chat"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-white/20"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Messages Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 bg-background flex flex-col space-y-2">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Loader2 className="animate-spin size-6" />
              </div>
            ) : messages.length === 0 ? (
              <div className="mt-10 text-center text-sm text-muted-foreground">
                No messages yet. Say hello!
              </div>
            ) : (
              renderedMessages
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Message Banner */}
          {error && (
            <div className="mx-3 mb-2 flex items-center gap-2 rounded-md border-l-2 border-destructive bg-subtle p-2 text-sm text-foreground animate-in slide-in-from-bottom-2 fade-in duration-200">
              <AlertCircle className="size-4 shrink-0" />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="rounded p-1 transition-colors hover:bg-muted"
                aria-label="Dismiss error"
              >
                <X className="size-3" />
              </button>
            </div>
          )}

          {/* Input Area (Fixed at bottom) */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-border bg-background p-3"
          >
            <input
              type="text"
              maxLength={120}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-full border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:border-ring"
              disabled={isSending}
            />
            <button
              title="send message"
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="rounded-full bg-primary p-2 text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Send className="size-5" />
              )}
            </button>
          </form>
        </div>
      )}

      {/* TOGGLE BUTTON (FAB) */}
      <button
        type="button"
        title="open Chat"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300
          ${
            isOpen
              ? "pointer-events-none absolute rotate-90 opacity-0"
              : "bg-accent text-accent-foreground hover:brightness-110"
          }
        `}
      >
        <MessageCircle className="size-8" />
      </button>
    </div>
  );
}

export default ChatBubble;
