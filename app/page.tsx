"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Settings,
  MessageSquare,
  Info,
  Clock,
  Zap,
  Lock,
  Cpu,
  Activity,
  Send,
  Smile,
  Paperclip,
  ChevronLeft,
  Trash2
} from "lucide-react";
import { clsx } from "clsx";
import { Avatar } from "./components/ui/Avatar";
import { Button } from "./components/ui/Button";
import { encryptMessage, decryptMessage } from "@/app/lib/encryption";

interface User {
  id: string; // This is the uniqueId (JHKZZ) or mapped _id? Database has _id and uniqueId. Let's use _id for internal logic.
  _id: string;
  name: string;
  uniqueId: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
}

interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Chat {
  _id: string;
  participants: User[];
  initiator: string;
  status: 'pending' | 'active' | 'rejected' | 'blocked';
  lastMessage?: string;
  updatedAt: string;
  unreadCount?: number; // Optional until implemented
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDeletingRef = useRef(false);

  // ...

  // Fetch Messages for Active Chat with Deletion Guard
  useEffect(() => {
    if (!activeChatId) return;

    const fetchMessages = async () => {
      if (isDeletingRef.current) return;
      try {
        const res = await fetch(`/api/messages?chatId=${activeChatId}&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (!isDeletingRef.current) {
            setMessages(data.messages || []);
          }
        }
      } catch (error) {
        console.error("Failed to load messages", error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChatId]);

  // Update handleDestroyTransmission
  const handleDestroyTransmission = async () => {
    if (!activeChatId || !confirm("WARNING: Initiate total data purge for this frequency? This action is irreversible.")) return;

    isDeletingRef.current = true; // Lock updates
    try {
      const res = await fetch(`/api/chats/destroy?chatId=${activeChatId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMessages([]);
        alert("Transmission terminated. Frequency sterilized.");
        setChats(prev => prev.map(c => c._id === activeChatId ? { ...c, lastMessage: 'Transmission Destroyed' } : c));
      }
    } catch (error) {
      console.error("Purge failed", error);
    } finally {
      // Keep it locked for a short buffer or unlock immediately? 
      // If we unlock immediately, a lingering fetch might still overwrite?
      // But we check `!isDeletingRef.current` in fetch.
      // If fetch returns NOW, `isDeleting` is true -> ignored.
      // Then we set `false` here.
      // A *new* poll starts later and sees `false` and gets empty list. Correct.
      // But if a fetch completes *after* this finally block?
      // It would see `false` and overwrite with old data?
      // No, if fetch completes after this, it implies fetch started a long time ago?
      // Or a new fetch started?
      // If new fetch starts, it gets empty list (because DELETE finished).
      // If OLD fetch completes after this?
      // We can't easily cancel promises.
      // We can use a request ID or timestamp?

      // Let's keep it simple: `isDeleting` shields the critical section.
      // The buffer is small.
      setTimeout(() => { isDeletingRef.current = false; }, 1000);
    }
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Hydration fix & Responsive check & Auth Check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      // Ensure _id exists, if not map id to _id (legacy check)
      if (!parsedUser._id && parsedUser.id) parsedUser._id = parsedUser.id;
      setUser(parsedUser);
    }

    return () => window.removeEventListener("resize", checkMobile);
  }, [router]);

  // Fetch Chats
  // Fetch Chats Polling
  useEffect(() => {
    if (!user?._id) return;

    const fetchChats = () => {
      fetch(`/api/chats?userId=${user._id}`)
        .then(res => res.json())
        .then(data => {
          if (data.chats) {
            // We should check if data actually changed to avoid re-renders?
            // But setChats usually handles referencing.
            // However, detailed comparison is expensive.
            setChats(data.chats);
          }
        })
        .catch(err => console.error("Failed to fetch chats", err));
    };

    fetchChats();
    const interval = setInterval(fetchChats, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [user]);

  // Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!user || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${searchQuery}&currentUserId=${user._id}`);
        const data = await res.json();
        setSearchResults(data.users || []);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user]);

  const activeChat = chats.find((c) => c._id === activeChatId);

  const handleChatSelect = (chatId: string) => {
    setActiveChatId(chatId);
    if (isMobile) {
      // Handle mobile view transition if needed
    }
  };

  const handleBackToSafe = () => {
    setActiveChatId(null);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChatId]);

  // Mark messages as read
  // Mark messages as read
  useEffect(() => {
    if (!activeChatId || !user) return;

    const hasUnread = messages.some(m => !m.isRead && m.senderId !== user._id);
    if (hasUnread) {
      // Call API
      fetch('/api/messages/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: activeChatId, userId: user._id })
      }).catch(err => console.error("Failed to mark read", err));
    }
  }, [messages, activeChatId, user]);

  // Fetch Messages for Active Chat




  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChatId || !user) return;

    // ENCRYPT HERE
    const encryptedContent = encryptMessage(newMessage);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: activeChatId,
          senderId: user._id,
          content: encryptedContent // Send encrypted
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          // We get back the encrypted message, so we can store it as is
          setMessages(prev => {
            if (prev.some(m => m._id === data.message._id)) return prev;
            return [...prev, data.message];
          });
          setNewMessage("");
        }
      }
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const startChat = async (selectedUser: User) => {
    if (!user) return;
    console.log("Starting chat with:", selectedUser);
    setSearchQuery("");
    setSearchResults([]);

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: user._id,
          targetUserId: selectedUser._id
        })
      });
      const data = await res.json();

      if (data.chat) {
        // Check if chat already exists in list
        setChats(prev => {
          const exists = prev.find(c => c._id === data.chat._id);
          if (exists) return prev;
          return [data.chat, ...prev];
        });
        setActiveChatId(data.chat._id);
      }
    } catch (error) {
      console.error("Failed to crate chat", error);
      alert("Failed to initiate link.");
    }
  };

  const handleChatAction = async (action: 'active' | 'rejected') => {
    if (!activeChatId) return;
    try {
      const res = await fetch(`/api/chats/${activeChatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });
      const data = await res.json();
      if (data.chat) {
        setChats(prev => prev.map(c => c._id === data.chat._id ? data.chat : c));
      }
    } catch (error) {
      console.error("Action failed", error);
    }
  };

  const handleStatusChange = async (newStatus: 'online' | 'offline' | 'busy') => {
    if (!user) return;
    try {
      const res = await fetch('/api/users/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, status: newStatus })
      });
      if (res.ok) {
        setUser(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[--color-background] text-[--color-text-primary] selection:bg-[--color-accent] selection:text-black">

      {/* Background Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[--color-secondary] opacity-[0.15] blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[--color-accent] opacity-[0.1] blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Sidebar */}
      <aside
        className={clsx(
          "flex flex-col border-r border-white/5 md:w-80 lg:w-96 w-full absolute md:relative z-10 h-full glass-premium transition-transform duration-300",
          activeChatId && isMobile ? "-translate-x-full" : "translate-x-0"
        )}
      >
        {/* Header */}
        <header className="p-5 flex items-center justify-between border-b border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <div className="relative group cursor-pointer">
                <Avatar
                  name={user.name}
                  size="md"
                  status={user.status || 'online'}
                  className="ring-2 ring-[--color-accent]/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all group-hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
                />
              </div>
            </Link>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Orbital Chat</h1>
              <button
                onClick={() => {
                  const next = (user.status === 'online' || !user.status) ? 'busy' : user.status === 'busy' ? 'offline' : 'online';
                  handleStatusChange(next);
                }}
                className="text-[10px] text-[--color-accent] uppercase tracking-widest flex items-center gap-1 font-semibold hover:opacity-80 transition-opacity focus:outline-none mt-1"
                title="Click to toggle status"
              >
                <div className={clsx("w-2 h-2 rounded-full mr-1 transition-colors duration-300",
                  (user.status === 'online' || !user.status) ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" :
                    user.status === 'busy' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" :
                      "bg-slate-500"
                )} />
                {user.status || 'ONLINE'}
              </button>
            </div>
          </div>
          <div className="flex gap-1">
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="hover:bg-white/5 hover:text-[--color-accent] transition-colors">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Search */}
        <div className="px-5 py-4 relative z-20">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[--color-accent] transition-colors" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[--color-accent]/50 focus:bg-black/40 transition-all placeholder:text-slate-600 shadow-inner"
              placeholder="Search via Signal ID..."
            />
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 mx-5 bg-[#050b18] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto"
              >
                <div className="p-2">
                  <h3 className="text-[10px] uppercase text-slate-500 font-bold px-3 py-2 tracking-wider">Detected Signals</h3>
                  {searchResults.map(result => (
                    <div
                      key={result.uniqueId}
                      onClick={() => startChat(result)}
                      className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group"
                    >
                      <Avatar name={result.name} size="sm" className="ring-1 ring-white/10" />
                      <div>
                        <p className="text-sm font-semibold text-slate-200 group-hover:text-white">{result.name}</p>
                        <p className="text-[10px] text-[--color-accent] font-mono tracking-wider">ID: {result.uniqueId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {searchQuery.length > 2 && searchResults.length === 0 && !isSearching && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-full left-0 right-0 mt-2 mx-5 bg-[#050b18] border border-white/10 rounded-xl p-4 text-center z-50"
              >
                <p className="text-xs text-slate-500">No signals detected for "{searchQuery}"</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 mt-2">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center opacity-50 p-8 h-full">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <MessageSquare className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400 mb-1">No Active Transmissions</p>
              <p className="text-xs text-slate-600">Search for a Signal ID to initiate link.</p>
            </div>
          ) : (
            chats.map((chat) => {
              const otherParticipant = chat.participants.find((p: User) => p._id !== user._id) || chat.participants[0];
              const isActive = activeChatId === chat._id;

              return (
                <motion.div
                  // layoutId={`chat-${chat._id}`} // Can cause issues if reusing ID
                  key={chat._id}
                  onClick={() => handleChatSelect(chat._id)}
                  className={clsx(
                    "p-3 rounded-2xl cursor-pointer flex items-center gap-4 transition-all border border-transparent hover:border-white/5 hover:bg-white/5 relative overflow-hidden group",
                    isActive ? "bg-white/5 border-[--color-accent]/20 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]" : ""
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isActive && <div className="absolute inset-0 bg-gradient-to-r from-[--color-accent]/10 to-transparent opacity-50 pointer-events-none" />}

                  <Avatar
                    name={otherParticipant.name}
                    status={otherParticipant.status}
                    size="lg"
                    className={clsx(isActive ? "ring-2 ring-[--color-accent]/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]" : "")}
                  />

                  <div className="flex-1 min-w-0 z-10">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={clsx("font-semibold truncate tracking-wide text-sm", isActive ? "text-[--color-accent] neon-text-cyan" : "text-slate-200")}>
                        {otherParticipant.name}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {/* Time format needed */}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate group-hover:text-slate-300 transition-colors font-light">
                      {chat.status === 'pending' ? (
                        <span className="italic text-[--color-secondary]">Link Authorization Pending...</span>
                      ) : (
                        chat.lastMessage || "No messages yet"
                      )}
                    </p>
                  </div>

                  {chat.status === 'pending' && chat.initiator !== user._id && (
                    <div className="w-2 h-2 rounded-full bg-[--color-secondary] animate-pulse shadow-[0_0_5px_var(--color-secondary)]"></div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={clsx(
        "flex-1 flex flex-col relative w-full h-full transition-transform duration-300 md:translate-x-0 absolute md:relative z-20",
        activeChatId || !isMobile ? "translate-x-0" : "translate-x-full"
      )}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[--color-surface]/80 backdrop-blur-xl sticky top-0 z-30 shadow-lg shadow-black/20">
              {/* Need to find other participant again */}
              {(() => {
                const otherParticipant = activeChat.participants.find((p: User) => p._id !== user._id) || activeChat.participants[0];
                return (
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden text-slate-400"
                      onClick={handleBackToSafe}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Avatar name={otherParticipant.name} size="md" status={otherParticipant.status} className="ring-1 ring-white/20" />
                    <div className="flex flex-col">
                      <h2 className="font-bold text-base leading-tight flex items-center gap-2 text-white tracking-wide">
                        {otherParticipant.name}
                      </h2>
                      <span className="text-[10px] text-[--color-accent] uppercase tracking-wider font-semibold">
                        SIGNAL: {otherParticipant.uniqueId} <span className="opacity-50 mx-1">|</span> {otherParticipant.status || 'OFFLINE'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center gap-2">
                {/* Only show actions if active */}
                {activeChat.status === 'active' && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-full"
                      title="Destroy Transmission"
                      onClick={handleDestroyTransmission}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </>
                )}
                <div className="w-px h-6 bg-white/10 mx-2 hidden md:block"></div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={clsx("text-slate-400 hover:text-white transition-all", showDetails && "text-[--color-accent] bg-[--color-accent]/10")}
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <Info className="w-5 h-5" />
                </Button>
              </div>
            </header>

            {/* Messages Area or Authorization Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide relative flex flex-col">
              {/* Grid Background Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

              {/* Status Check */}
              {activeChat.status === 'pending' ? (
                <div className="flex-1 flex flex-col items-center justify-center z-10">
                  <div className="max-w-md w-full glass-premium p-8 rounded-2xl border border-[--color-secondary]/30 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[--color-secondary] animate-pulse"></div>

                    <Lock className="w-12 h-12 text-[--color-secondary] mx-auto mb-4" />

                    <h3 className="text-xl font-bold text-white mb-2">Secure Link Authorization Required</h3>

                    {activeChat.initiator === user._id ? (
                      <p className="text-slate-400 text-sm mb-6">
                        You have initiated a secure link protocol. Waiting for the recipient to authorize the connection.
                        <br /><br />
                        <span className="text-[10px] uppercase tracking-widest text-[--color-secondary]">Status: Pending Approval</span>
                      </p>
                    ) : (
                      <>
                        <p className="text-slate-400 text-sm mb-6">
                          Incoming transmission request. To establish a secure channel, you must authorize this link.
                        </p>
                        <div className="flex gap-4 justify-center">
                          <Button
                            onClick={() => handleChatAction('active')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                          >
                            Authorize Link
                          </Button>
                          <Button
                            onClick={() => handleChatAction('rejected')}
                            variant="ghost"
                            className="text-red-400 border border-red-500/30 hover:bg-red-500/10"
                          >
                            Terminate
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                // Active Chat Messages
                <div className="w-full flex-1 flex flex-col justify-end space-y-4 min-h-0">
                  {messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center z-10 opacity-50 mb-auto">
                      <p className="text-slate-500 text-sm">Secure Channel Established.</p>
                      <p className="text-slate-600 text-xs mt-2">All messages are end-to-end encrypted.</p>
                    </div>
                  )}

                  {messages.map((msg) => {
                    const isMe = msg.senderId === user._id;
                    const decryptedContent = decryptMessage(msg.content); // Decrypt on render

                    return (
                      <motion.div
                        key={msg._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx(
                          "flex gap-3 max-w-[85%] relative z-10",
                          isMe ? "ml-auto flex-row-reverse" : ""
                        )}
                      >
                        {/* Only show avatar for other person */}
                        {!isMe && (
                          <div className="mt-auto">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 border border-white/10 flex-shrink-0">
                              {/* Simplified Avatar usage or fetch user */}
                              {/* For now, just a placeholder or could pass otherParticipant name if available */}
                            </div>
                          </div>
                        )}

                        <div className={clsx(
                          "flex flex-col gap-1 min-w-[60px]",
                          isMe ? "items-end" : "items-start"
                        )}>
                          <div className={clsx(
                            "px-4 py-3 rounded-2xl text-sm leading-relaxed relative group transition-all duration-300 break-words max-w-full text-left font-mono",
                            isMe
                              ? "bg-[--color-accent]/10 border border-[--color-accent]/20 text-[--color-accent] rounded-br-none shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                              : "glass-card text-slate-200 rounded-bl-none hover:bg-white/5 border border-white/10"
                          )}>
                            {decryptedContent}
                          </div>

                          <span className="text-[9px] text-slate-600 font-mono px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area - Only if Active */}
            {activeChat.status === 'active' && (
              <div className="p-4 md:p-6 bg-transparent sticky bottom-0 z-40">
                <div className="absolute inset-0 bg-gradient-to-t from-[--color-background] via-[--color-background] to-transparent pointer-events-none" />

                <div className="flex items-end gap-3 max-w-4xl mx-auto relative z-10">
                  <div className="flex-1 glass-premium rounded-2xl flex items-center p-2 focus-within:ring-1 focus-within:ring-[--color-accent]/50 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-[--color-accent] hover:bg-transparent">
                      <Smile className="w-5 h-5" />
                    </Button>

                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 bg-transparent border-0 focus:ring-0 text-sm text-slate-100 placeholder:text-slate-600 resize-none max-h-32 py-3 px-2 scrollbar-hide font-light focus:outline-none focus-visible:ring-0"
                      placeholder="Transmit data..."
                      rows={1}
                      style={{ minHeight: '44px' }}
                    />

                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-[--color-accent] hover:bg-transparent">
                      <Paperclip className="w-5 h-5" />
                    </Button>
                  </div>

                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="h-12 w-12 rounded-2xl bg-[--color-accent] text-black hover:bg-[--color-accent] hover:scale-105 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex-shrink-0 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5 ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] select-none relative z-20">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-[--color-accent] blur-[60px] opacity-20 animate-pulse-slow"></div>
              <div className="w-32 h-32 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl relative z-10 ring-1 ring-white/5">
                <MessageSquare className="w-12 h-12 text-[--color-accent]" />
              </div>
            </div>

            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500 mb-4 tracking-tight">System Ready</h2>
            <p className="max-w-xs text-slate-400 font-light leading-relaxed">Establish a secure connection. Select a frequency to begin transmission.</p>

            <div className="mt-12 grid grid-cols-3 gap-6">
              {[
                { icon: Zap, label: "Neural\nSync", color: "text-[--color-secondary]" },
                { icon: Clock, label: "Reminders\nActive", color: "text-[--color-accent]" },
                { icon: Lock, label: "Encrypted\nchannel", color: "text-emerald-400" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-3 group cursor-default">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/10 transition-all group-hover:scale-110">
                    <item.icon className={clsx("w-5 h-5", item.color)} />
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold whitespace-pre-line leading-relaxed">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Details Panel - Third Column */}
      <AnimatePresence>
        {activeChat && showDetails && (
          // Details panel - hidden for now
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 0, opacity: 0 }} // Keeping hidden logic
            exit={{ width: 0, opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
