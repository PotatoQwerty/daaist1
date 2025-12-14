"use client";
import { getChatMessages, addChatMessage } from "@/lib/Chat"; // Assuming you have the add function
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import Message from "./Message";
import { useSession } from "next-auth/react";
import { supabaseClient } from "@/lib/supabase/client";

function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  // Ref to auto-scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const fetchMessages = async () => {
        setIsLoading(true);
        const res = await getChatMessages();
        setMessages(res || []);
        setIsLoading(false);
      };
      fetchMessages();
    }
  }, [isOpen]); // Only fetch messages when opened

  // Subscribe once for realtime inserts
  useEffect(() => {
    const channel = supabaseClient
      .channel("public-chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const incoming = payload.new;
          setMessages((prev) => {
            // If exact id already exists, skip
            if (prev.find((m) => m.id === incoming.id)) return prev;

            // Remove optimistic/temp message with matching content + user_id
            const filtered = prev.filter(
              (m) =>
                !(
                  m.isTemp &&
                  m.user_id === incoming.user_id &&
                  m.content === incoming.content
                )
            );

            return [...filtered, incoming];
          });
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !session.user.isdaa) return;
    if (!newMessage.trim()) return;

    // Optimistic Update (Show message immediately before DB confirms)

    const tempId = crypto.randomUUID();

    const tempMsg = {
      id: tempId,
      content: newMessage,
      created_at: new Date().toISOString(),
      user_id: session?.user.id,
      user_image: session.user.image,
      isTemp: true,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    // Send minimal payload to server (avoid sending temp fields)
    const payload = {
      content: tempMsg.content,
    };

    const res = await addChatMessage(payload);

    if (!res) {
      // mark as failed (could also remove or add retry UI)
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, isFailed: true } : m))
      );
      alert("Failed to send message.");
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
          img={msg.user_image}
          username={msg.user_username}
        />
      );
    });
  }, [messages, session?.user?.id]);
  if (!session || !session.user.isdaa) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="mb-4 w-[350px] h-[500px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
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
              className="hover:bg-white/20 p-1 rounded-full transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Messages Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 bg-background flex flex-col space-y-2">
            {isLoading ? (
              <div className="flex justify-center items-center h-full text-gray-400">
                <Loader2 className="animate-spin size-6" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-10 text-sm">
                No messages yet. Say hello!
              </div>
            ) : (
              renderedMessages
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area (Fixed at bottom) */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-background border-t flex items-center gap-2"
          >
            <input
              type="text"
              maxLength={120}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 py-2 px-3 bg-background rounded-full text-sm focus:outline-none border-white border focus:ring-2 focus:ring-primary/50"
            />
            <button
              title="send message"
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="size-5" />
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
              ? "bg-gray-500 hover:bg-gray-600 rotate-90 opacity-0 pointer-events-none absolute"
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          }
        `}
      >
        <MessageCircle className="size-8" />
      </button>
    </div>
  );
}

export default ChatBubble;
