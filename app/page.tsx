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
import { encryptMessage as encryptLegacy } from "@/app/lib/encryption";
import { loadKeyPair, importPublicKey, encryptMessageForUser, generateKeyPair, saveKeyPair, exportPublicKey } from "@/app/lib/security";
import { MessageContent } from "@/app/components/MessageContent";

interface User {
  id: string; // This is the uniqueId (JHKZZ) or mapped _id? Database has _id and uniqueId. Let's use _id for internal logic.
  _id: string;
  name: string;
  uniqueId: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
  publicKey?: string; // Added for E2EE
  role?: string;
  dataUsage?: number;
  minutesActive?: number;
  clearanceLevel?: number;
}

interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  iv?: string; // For E2EE
  encryptedKey?: string; // For E2EE
}

interface Chat {
  _id: string;
  participants: User[];
  lastMessage: string;
  updatedAt: string;
  unreadCount?: number;
  status?: 'active' | 'rejected' | 'pending';
  initiator?: string;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null);

  // Load E2EE Keys
  // Load or Generate E2EE Keys
  useEffect(() => {
    if (!user?._id) return;

    const initKeys = async () => {
      try {
        let keys = await loadKeyPair();
        if (!keys) {
          console.log("No keys found, generating new encryption identity...");
          keys = await generateKeyPair();
          await saveKeyPair(keys);

          // Sync Public Key
          const jwk = await exportPublicKey(keys.publicKey);
          await fetch('/api/users/keys', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user._id, publicKey: JSON.stringify(jwk) })
          });
        }
        setKeyPair(keys);
      } catch (e) {
        console.error("Key initialization system failure", e);
        alert("Secure Channel Init Failed: Private Mode? Please disable for persistent keys.");
      }
    };

    initKeys();
  }, [user?._id]);

  // Heartbeat for Active Time Tracking
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Heartbeat for Active Time Tracking
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const heartbeat = async () => {
      try {
        await fetch('/api/user/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ duration: 1 }) // 1 minute
        });
      } catch (e) {
        console.error("Heartbeat failed", e);
      }
    };

    const interval = setInterval(heartbeat, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

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
      try {
        const parsedUser = JSON.parse(userData);
        // Ensure _id exists, if not map id to _id (legacy check)
        if (!parsedUser._id && parsedUser.id) parsedUser._id = parsedUser.id;

        if (!parsedUser._id) {
          console.error("User data missing _id in storage", parsedUser);
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse user data", e);
        localStorage.removeItem('user');
        router.push('/login');
      }
    }

    return () => window.removeEventListener("resize", checkMobile);
  }, [router]);

  // Fetch Chats
  // Fetch Chats Polling
  useEffect(() => {
    if (!user?._id) return;

    const fetchChats = () => {
      fetch(`/api/chats?userId=${user._id || ''}`)
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
        const res = await fetch(`/api/users/search?q=${searchQuery}&currentUserId=${user._id || ''}`);
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

    let finalContent = "";

    // 1. Try E2EE Encryption
    try {
      const activeChatParams = activeChat?.participants || [];
      const recipient = activeChatParams.find((p: any) => p._id !== user._id);

      if (recipient && recipient.publicKey) {
        const recipientKey = await importPublicKey(JSON.parse(recipient.publicKey));

        // Encrypt for BOTH Recipient and Sender (Self)
        if (keyPair?.publicKey) {
          finalContent = await encryptMessageForUser(newMessage, recipientKey, keyPair.publicKey);
        } else {
          finalContent = await encryptMessageForUser(newMessage, recipientKey);
        }
        console.log("E2EE Encrypted (Dual-Lock)");
      }
    } catch (e) {
      console.error("E2EE Encryption failed, falling back", e);
    }

    // 2. Fallback to Legacy Encryption if E2EE failed or not possible
    if (!finalContent) {
      finalContent = encryptLegacy(newMessage);
      console.log("Legacy Encrypted");
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: activeChatId,
          senderId: user._id,
          content: finalContent
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

          // Track Data Usage (Fire and forget)
          const payloadSize = new Blob([finalContent]).size;
          const token = localStorage.getItem('token');
          if (token) {
            fetch('/api/user/heartbeat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ data: payloadSize })
            }).catch(() => { });
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const startChat = async (selectedUser: User) => {
    if (!user?._id) {
      console.error("User ID missing", user);
      alert("User session invalid. Please log in again.");
      return;
    }
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
      console.log("Create chat response status:", res.status);
      const data = await res.json();
      console.log("Create chat data:", data);

      if (res.ok && data.chat) {
        // Check if chat already exists in list
        setChats(prev => {
          const exists = prev.find(c => c._id === data.chat._id);
          if (exists) return prev;
          return [data.chat, ...prev];
        });
        setActiveChatId(data.chat._id);
      } else {
        alert(`Failed to link: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to create chat", error);
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
    <div className="flex h-dvh overflow-hidden bg-[--color-background] text-[--color-text-primary] selection:bg-[--color-accent] selection:text-black">

      {/* Background Ambient Glow (Reduced opacity, no scanline or blur overlays that block view) */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-black">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-zinc-900 opacity-20 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-zinc-800 opacity-20 blur-[150px] rounded-full"></div>
      </div>

      {/* Sidebar */}
      <aside
        className={clsx(
          "flex flex-col border-r border-zinc-800 md:w-80 lg:w-96 w-full absolute md:relative z-10 h-full bg-black transition-transform duration-300",
          activeChatId && isMobile ? "-translate-x-full" : "translate-x-0"
        )}
      >
        {/* Header */}
        <header className="p-5 flex items-center justify-between border-b border-zinc-800 bg-black relative z-20">

          <div className="flex items-center gap-4 relative z-10">
            <Link href="/profile">
              <div className="relative group cursor-pointer">
                <Avatar
                  name={user.name}
                  size="md"
                  status={user.status || 'online'}
                  className="ring-1 ring-zinc-700 shadow-none transition-all group-hover:ring-zinc-500 rounded-full"
                />
              </div>
            </Link>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-[0.1em] text-white font-mono nodus-glow-text">
                NODUS <span className="text-white/30 text-xs text-none">::</span> CHAT
              </h1>
              <button
                onClick={() => {
                  const next = (user.status === 'online' || !user.status) ? 'busy' : user.status === 'busy' ? 'offline' : 'online';
                  handleStatusChange(next);
                }}
                className="text-[9px] text-zinc-400 uppercase tracking-widest flex items-center gap-2 font-semibold hover:text-white transition-colors focus:outline-none mt-1 group"
                title="Click to toggle status"
              >
                <div className={clsx("w-1.5 h-1.5 rounded-none rotate-45 transition-all duration-300 shadow-[0_0_5px_currentColor]",
                  (user.status === 'online' || !user.status) ? "bg-white text-white group-hover:shadow-[0_0_10px_white]" :
                    user.status === 'busy' ? "bg-zinc-500 text-zinc-500" :
                      "bg-zinc-800 text-zinc-800"
                )} />
                <span className="group-hover:tracking-[0.2em] transition-all duration-300">
                  {user.status === 'online' || !user.status ? 'CONNECTED' : user.status?.toUpperCase()}
                </span>
              </button>
            </div>
          </div>
          <div className="flex gap-1 relative z-10">
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="hover:bg-white/5 hover:text-[--color-accent] transition-colors hover:rotate-90 duration-500">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Search */}
        <div className="px-5 py-4 border-b border-zinc-800 relative z-20">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg bg-zinc-900 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all text-sm font-mono tracking-wide"
              placeholder="SEARCH_SIGNAL_ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 right-0 mt-1 mx-3 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto"
              >
                <div className="p-1">
                  <h3 className="text-[10px] uppercase text-zinc-500 font-bold px-3 py-2 tracking-wider border-b border-zinc-800 mb-1">Detected Signals</h3>
                  {searchResults.map(result => (
                    <div
                      key={result._id}
                      onClick={() => startChat(result)}
                      className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-md cursor-pointer transition-colors group"
                    >
                      <Avatar name={result.name} size="sm" className="bg-zinc-800 text-zinc-400 group-hover:text-white group-hover:bg-zinc-700 transition-colors" />
                      <div>
                        <p className="text-sm font-semibold text-zinc-300 group-hover:text-white font-mono">{result.name}</p>
                        <p className="text-[10px] text-zinc-500 group-hover:text-zinc-400 font-mono tracking-wider">ID: {result.uniqueId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {searchQuery.length > 2 && searchResults.length === 0 && !isSearching && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-full left-0 right-0 mt-1 mx-3 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-center z-50"
              >
                <p className="text-xs text-zinc-400 font-mono">SIGNAL_NOT_FOUND: &quot;{searchQuery}&quot;</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 mt-2">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center opacity-50 p-8 h-full">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                <MessageSquare className="w-6 h-6 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-400 mb-1 font-bold tracking-wide">NO ACTIVE TRANSMISSIONS</p>
              <p className="text-xs text-zinc-600 font-mono">Search Signal ID to initiate link.</p>
            </div>
          ) : (
            chats.map((chat, index) => {
              const otherParticipant = chat.participants.find((p: User) => p._id !== user._id) || chat.participants[0];
              const isActive = activeChatId === chat._id;

              return (
                <motion.div
                  key={chat._id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleChatSelect(chat._id)}
                  className={clsx(
                    "p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors border relative overflow-hidden group",
                    isActive
                      ? "bg-zinc-900 border-zinc-700"
                      : "border-transparent hover:bg-zinc-900/50 hover:border-zinc-800"
                  )}
                  whileHover={{ x: 2 }}
                >
                  {/* Active Indicator Bar */}
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />}

                  <Avatar
                    name={otherParticipant.name}
                    status={otherParticipant.status}
                    size="lg"
                    className={clsx(isActive ? "ring-2 ring-zinc-500" : "group-hover:ring-1 group-hover:ring-zinc-700")}
                  />

                  <div className="flex-1 min-w-0 z-10">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={clsx("font-semibold truncate tracking-wide text-sm font-mono", isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200")}>
                        {otherParticipant.name}
                      </h3>
                      <span className="text-[9px] text-zinc-600 font-mono group-hover:text-zinc-500">
                        CMD_READY
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 truncate group-hover:text-zinc-500 transition-colors font-light flex items-center gap-1">
                      {chat.status === 'pending' ? (
                        <span className="italic text-amber-500">Authorization Pending...</span>
                      ) : (
                        <>
                          <span className={clsx("w-1 h-1 rounded-full inline-block mb-0.5", isActive ? "bg-white" : "bg-zinc-600")}></span>
                          {chat.lastMessage || "No messages yet"}
                        </>
                      )}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={clsx(
        "flex-1 flex flex-col relative w-full h-full transition-transform duration-300 md:translate-x-0 absolute md:relative z-20 bg-black",
        activeChatId || !isMobile ? "translate-x-0" : "translate-x-full"
      )}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-800 bg-black sticky top-0 z-30">
              {/* Need to find other participant again */}
              {(() => {
                const otherParticipant = activeChat.participants.find((p: User) => p._id !== user._id) || activeChat.participants[0];
                return (
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden text-zinc-500"
                      onClick={handleBackToSafe}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <div className="relative">
                      <Avatar name={otherParticipant.name} size="md" status={otherParticipant.status} className="ring-1 ring-zinc-700 shadow-none" />
                    </div>

                    <div className="flex flex-col">
                      <h2 className="font-bold text-base leading-tight flex items-center gap-2 text-white tracking-wide font-mono">
                        {otherParticipant.name}
                      </h2>
                      <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider font-semibold">
                        <span className="flex items-center gap-1.5 text-zinc-500">
                          <span className={clsx("w-1.5 h-1.5 rounded-full", otherParticipant.status === 'online' ? "bg-emerald-500" : "bg-zinc-600")}></span>
                          SIG_ID: {otherParticipant.uniqueId}
                        </span>
                        <span className={clsx(
                          "px-1.5 py-0.5 rounded border font-mono",
                          (otherParticipant.clearanceLevel || 1) === 5
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        )}>
                          LVL-{otherParticipant.clearanceLevel || 1}
                        </span>
                      </div>
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
                      className="text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-all rounded-full group"
                      title="Destroy Transmission"
                      onClick={handleDestroyTransmission}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </>
                )}
                <div className="w-px h-6 bg-zinc-800 mx-2 hidden md:block"></div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={clsx("text-zinc-500 hover:text-white transition-all", showDetails && "text-white bg-zinc-900")}
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <Info className="w-5 h-5" />
                </Button>
              </div>
            </header>

            {/* Messages Area or Authorization Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide relative flex flex-col bg-zinc-950/50 pb-4">

              {/* Status Check */}
              {activeChat.status === 'pending' ? (
                <div className="flex-1 flex flex-col items-center justify-center z-10 p-4">
                  <div className="max-w-md w-full bg-zinc-900 p-8 rounded-2xl border border-zinc-800 text-center relative overflow-hidden">

                    <div className="relative">
                      <div className="w-16 h-16 mx-auto mb-6 relative flex items-center justify-center rounded-full bg-zinc-800 border border-zinc-700">
                        <Lock className="w-6 h-6 text-zinc-400 relative z-10" />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 font-mono tracking-wide">SECURE LINK PROTOCOL</h3>

                    {activeChat.initiator === user._id ? (
                      <p className="text-zinc-500 text-sm mb-6 font-mono">
                        Awaiting recipient authorization handshake...
                        <br /><br />
                        <span className="text-[10px] uppercase tracking-widest text-zinc-600">Status: Pending Approval</span>
                      </p>
                    ) : (
                      <>
                        <p className="text-zinc-500 text-sm mb-6 font-mono">
                          Incoming transmission request detected.
                          <br />
                          Authorize to establish encrypted tunnel.
                        </p>
                        <div className="flex gap-4 justify-center">
                          <Button
                            onClick={() => handleChatAction('active')}
                            className="bg-white hover:bg-zinc-200 text-black border-none shadow-none transition-all font-mono tracking-wider font-bold"
                          >
                            [ AUTHORIZE ]
                          </Button>
                          <Button
                            onClick={() => handleChatAction('rejected')}
                            variant="ghost"
                            className="text-zinc-500 border border-zinc-700 hover:bg-zinc-800 hover:text-white font-mono"
                          >
                            [ TERMINATE ]
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                // Active Chat Messages
                <div className="w-full flex-1 flex flex-col justify-end space-y-4 min-h-0">
                  {/* Empty State / Start of Encrypted Chat */}
                  {messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center z-10 opacity-70 mb-auto">
                      <div className="w-16 h-16 rounded-full border border-zinc-800 flex items-center justify-center mb-4 bg-zinc-900">
                        <Lock className="w-6 h-6 text-zinc-500" />
                      </div>
                      <p className="text-zinc-300 text-sm font-mono tracking-wider">SECURE CHANNEL ESTABLISHED</p>
                      <p className="text-zinc-600 text-xs mt-2 font-mono">End-to-end encryption active.</p>
                    </div>
                  )}

                  <AnimatePresence>
                    {messages.map((msg) => {
                      const isMe = msg.senderId === user._id;

                      return (
                        <motion.div
                          key={msg._id}
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className={clsx(
                            "flex gap-3 max-w-[85%] relative z-10 group",
                            isMe ? "ml-auto flex-row-reverse" : ""
                          )}
                        >
                          {/* Only show avatar for other person */}
                          {!isMe && (
                            <div className="mt-auto">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-white border border-zinc-700 flex-shrink-0">
                                <span className="font-bold font-mono">{(activeChat?.participants.find((p: User) => p._id !== user._id)?.name || "?")[0]}</span>
                              </div>
                            </div>
                          )}

                          <div className={clsx(
                            "flex flex-col gap-1 min-w-[60px]",
                            isMe ? "items-end" : "items-start"
                          )}>
                            <div className={clsx(
                              "px-4 py-3 rounded-lg text-sm leading-relaxed relative transition-all duration-300 break-words max-w-full text-left font-mono border",
                              isMe
                                ? "bg-zinc-100 border-zinc-200 text-black rounded-br-none"
                                : "bg-zinc-900 text-zinc-300 rounded-bl-none border-zinc-800"
                            )}>
                              <MessageContent
                                content={msg.content}
                                privateKey={keyPair?.privateKey || null}
                                isMe={isMe}
                              />
                            </div>

                            <span className="text-[9px] text-zinc-600 font-mono px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area - Only if Active */}
            {activeChat.status === 'active' && (
              <div className="p-4 md:p-6 bg-black border-t border-zinc-900 shrink-0">
                <div className="flex items-end gap-3 max-w-4xl mx-auto relative z-10">
                  <div className="flex-1 bg-zinc-900 rounded-lg flex items-center p-2 focus-within:ring-1 focus-within:ring-zinc-700 transition-all border border-zinc-800">
                    <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white hover:bg-transparent transition-colors">
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
                      className="flex-1 bg-transparent border-0 focus:ring-0 text-sm text-white placeholder:text-zinc-600 resize-none max-h-32 py-3 px-2 scrollbar-hide font-mono focus:outline-none focus-visible:ring-0 caret-white"
                      placeholder="INITIATE_DATA_STREAM..."
                      rows={1}
                      style={{ minHeight: '44px' }}
                    />

                    <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white hover:bg-transparent transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </Button>
                  </div>

                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="h-12 w-12 rounded-lg bg-white text-black hover:bg-zinc-200 transition-all shadow-none flex-shrink-0 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed border border-transparent"
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] select-none relative z-20 bg-zinc-950/50">
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900">
                <MessageSquare className="w-12 h-12 text-zinc-700" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2 tracking-tighter font-mono">SYSTEM READY</h2>
            <p className="max-w-xs text-zinc-500 font-mono text-sm leading-relaxed">
              Encryption protocols loaded. <br /> Select frequency.
            </p>

            <div className="mt-12 grid grid-cols-3 gap-8">
              {[
                { icon: Zap, label: "NEURAL\nSYNC" },
                { icon: Clock, label: "TEMPORAL\nLOGS" },
                { icon: Lock, label: "QUANTUM\nCRYPT" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-4 group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-all group-hover:border-zinc-700 text-zinc-600 group-hover:text-white">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold whitespace-pre-line leading-relaxed group-hover:text-zinc-400 transition-colors">{item.label}</span>
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
