"use client";

import { useState } from "react";
import VendorPortalLayout from "@/components/VendorPortalLayout";

type MessageSender = "customer" | "vendor" | "system";
type Message = { id: string; sender: MessageSender; senderName?: string; text: string; time: string };
type ConversationType = "customer" | "group";

type Conversation = {
  id: string;
  type: ConversationType;
  title: string;
  subtitle: string;
  avatar: string;
  participants?: { name: string; role: string }[];
  lastMessage: string;
  lastTime: string;
  unread: number;
  eventBrief?: { eventType: string; date: string; guests: number; venue: string; requirements: string };
  messages: Message[];
};

const mockConversations: Conversation[] = [
  {
    id: "group-1",
    type: "group",
    title: "March 15 Wedding — Grand Ballroom KL",
    subtitle: "Sarah Ahmad, Hassan Catering, Lisa Photography",
    avatar: "G",
    participants: [
      { name: "Sarah Ahmad", role: "Customer" },
      { name: "Hassan Catering", role: "Caterer" },
      { name: "Lisa Photography", role: "Photographer" },
    ],
    lastMessage: "Lisa Photography: I'll arrive at 4pm for the pre-ceremony shots.",
    lastTime: "30 min ago",
    unread: 2,
    eventBrief: { eventType: "Wedding Reception", date: "March 15, 2025", guests: 250, venue: "Grand Ballroom at The Majestic KL", requirements: "Halal catering. Traditional Malay + Western fusion. Full-day photography." },
    messages: [
      { id: "gm1", sender: "system", text: "Group chat created — all services confirmed", time: "3 days ago" },
      { id: "gm2", sender: "customer", senderName: "Sarah Ahmad", text: "Can we do the solemnization at 3pm and reception at 6pm?", time: "1 day ago" },
      { id: "gm3", sender: "vendor", senderName: "You", text: "Absolutely. We'll set up the solemnization area in the garden and transition to the ballroom.", time: "1 day ago" },
      { id: "gm4", sender: "vendor", senderName: "Lisa Photography", text: "I'll arrive at 4pm for the pre-ceremony shots.", time: "30 min ago" },
    ],
  },
  {
    id: "conv-1",
    type: "customer",
    title: "Sarah Ahmad",
    subtitle: "Wedding — March 15, 2025",
    avatar: "S",
    lastMessage: "Thank you! Looking forward to it.",
    lastTime: "2 days ago",
    unread: 0,
    messages: [
      { id: "m1", sender: "system", text: "Inquiry received — Wedding, 250 guests, March 15", time: "5 days ago" },
      { id: "m2", sender: "customer", senderName: "Sarah Ahmad", text: "Hi, can you accommodate 250 guests for a wedding?", time: "5 days ago" },
      { id: "m3", sender: "vendor", senderName: "You", text: "Yes! We'd love to host your wedding. I've prepared a quote for you.", time: "4 days ago" },
      { id: "m4", sender: "system", text: "Quote sent: MYR 8,550", time: "4 days ago" },
      { id: "m5", sender: "system", text: "✓ Booking confirmed", time: "3 days ago" },
      { id: "m6", sender: "customer", senderName: "Sarah Ahmad", text: "Thank you! Looking forward to it.", time: "2 days ago" },
    ],
  },
  {
    id: "conv-2",
    type: "customer",
    title: "Ahmad Razak",
    subtitle: "Corporate Dinner — April 2025",
    avatar: "A",
    lastMessage: "We'll discuss internally and get back to you.",
    lastTime: "1 day ago",
    unread: 0,
    messages: [
      { id: "m7", sender: "system", text: "Inquiry received — Corporate, 150 guests", time: "3 days ago" },
      { id: "m8", sender: "customer", senderName: "Ahmad Razak", text: "Looking for a venue for our annual company dinner. 150 people, formal.", time: "3 days ago" },
      { id: "m9", sender: "vendor", senderName: "You", text: "Our Grand Hall seats 150 in banquet setup. Quote: RM 12,000 including AV and parking.", time: "3 days ago" },
      { id: "m10", sender: "system", text: "Quote sent: MYR 12,000", time: "3 days ago" },
      { id: "m11", sender: "customer", senderName: "Ahmad Razak", text: "We'll discuss internally and get back to you.", time: "1 day ago" },
    ],
  },
];

export default function VendorMessagesPage() {
  const [activeConversation, setActiveConversation] = useState<string | null>(mockConversations[0]?.id ?? null);
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState(mockConversations);
  const [filter, setFilter] = useState<"all" | "customer" | "group">("all");

  const filtered = conversations.filter((c) => filter === "all" ? true : c.type === filter);
  const activeConv = conversations.find((c) => c.id === activeConversation);

  const handleSend = () => {
    if (!newMessage.trim() || !activeConversation) return;
    const msg: Message = { id: `m-${Date.now()}`, sender: "vendor", senderName: "You", text: newMessage.trim(), time: "Just now" };
    setConversations((prev) => prev.map((c) => c.id === activeConversation ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, lastTime: "Just now" } : c));
    setNewMessage("");
  };

  return (
    <VendorPortalLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="mt-0.5 text-sm text-gray-500">{conversations.length} conversations</p>
        </div>
        <div className="flex gap-1">
          {(["all", "customer", "group"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${filter === f ? "bg-[#EB4D4B] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {f === "all" ? "All" : f === "customer" ? "1:1" : "Group"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm" style={{ height: "calc(100vh - 240px)", minHeight: "500px" }}>
        <div className="flex h-full">
          <div className="w-72 shrink-0 border-r border-gray-200 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {filtered.map((conv) => (
                <button key={conv.id} onClick={() => setActiveConversation(conv.id)} className={`flex w-full items-start gap-3 border-b border-gray-100 p-4 text-left transition-colors ${activeConversation === conv.id ? "bg-red-50/50" : "hover:bg-gray-50"}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${conv.type === "group" ? "bg-purple-500" : activeConversation === conv.id ? "bg-[#EB4D4B]" : "bg-gray-400"}`}>{conv.avatar}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">{conv.title}</p>
                      {conv.unread > 0 && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#EB4D4B] text-[9px] font-bold text-white">{conv.unread}</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 truncate">{conv.subtitle}</p>
                    <p className="mt-1 text-xs text-gray-400 truncate">{conv.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {activeConv ? (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${activeConv.type === "group" ? "bg-purple-500" : "bg-gray-400"}`}>{activeConv.avatar}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{activeConv.title}</p>
                  {activeConv.type === "group" && activeConv.participants && (<div className="flex gap-1 mt-0.5">{activeConv.participants.map((p) => (<span key={p.name} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">{p.role}</span>))}</div>)}
                  {activeConv.type !== "group" && <p className="text-xs text-gray-500">{activeConv.subtitle}</p>}
                </div>
              </div>
              {activeConv.type === "group" && activeConv.eventBrief && (
                <div className="border-b border-gray-100 bg-gray-50 px-5 py-2.5">
                  <div className="flex items-center gap-2"><svg className="h-3.5 w-3.5 text-[#EB4D4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg><span className="text-xs font-semibold text-gray-700">Event Brief</span></div>
                  <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                    <span className="text-gray-400">Event: <span className="text-gray-700 font-medium">{activeConv.eventBrief.eventType}</span></span>
                    <span className="text-gray-400">Date: <span className="text-gray-700 font-medium">{activeConv.eventBrief.date}</span></span>
                    <span className="text-gray-400">Guests: <span className="text-gray-700 font-medium">{activeConv.eventBrief.guests} pax</span></span>
                    <span className="col-span-2 text-gray-400">Notes: <span className="text-gray-700">{activeConv.eventBrief.requirements}</span></span>
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {activeConv.messages.map((msg) => {
                  if (msg.sender === "system") return (<div key={msg.id} className="flex justify-center"><span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">{msg.text}</span></div>);
                  const isMe = msg.sender === "vendor" && msg.senderName === "You";
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] ${!isMe && activeConv.type === "group" ? "flex gap-2" : ""}`}>
                        {!isMe && activeConv.type === "group" && <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 mt-1">{msg.senderName?.charAt(0)}</div>}
                        <div>
                          {!isMe && activeConv.type === "group" && <p className="mb-0.5 text-[10px] font-medium text-gray-500">{msg.senderName}</p>}
                          <div className={`rounded-2xl px-4 py-2.5 ${isMe ? "bg-[#EB4D4B] text-white" : "bg-gray-100 text-gray-900"}`}>
                            <p className="text-sm">{msg.text}</p>
                            <p className={`mt-1 text-[10px] ${isMe ? "text-white/70" : "text-gray-400"}`}>{msg.time}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-200 px-5 py-3">
                <div className="flex items-center gap-3">
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }} placeholder={activeConv.type === "group" ? "Message the group..." : "Type a message..."} className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20" />
                  <button onClick={handleSend} disabled={!newMessage.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EB4D4B] text-white transition-all hover:bg-[#dc2626] disabled:opacity-40"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center"><p className="text-sm text-gray-400">Select a conversation</p></div>
          )}
        </div>
      </div>
    </VendorPortalLayout>
  );
}
