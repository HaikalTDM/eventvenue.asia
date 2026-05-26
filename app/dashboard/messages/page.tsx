"use client";

import { useState } from "react";
import Link from "next/link";

type MessageSender = "customer" | "vendor" | "system";

type Message = {
  id: string;
  sender: MessageSender;
  senderName?: string;
  text: string;
  time: string;
};

type ConversationType = "venue" | "service" | "group";

type Conversation = {
  id: string;
  type: ConversationType;
  title: string;
  subtitle: string;
  avatar: string;
  participants?: { name: string; role: string; avatar: string }[];
  lastMessage: string;
  lastTime: string;
  unread: number;
  eventBrief?: {
    eventType: string;
    date: string;
    guests: number;
    venue: string;
    requirements: string;
  };
  messages: Message[];
};

const filterTabs = [
  { key: "all", label: "All" },
  { key: "group", label: "Group" },
  { key: "venue", label: "Venues" },
  { key: "service", label: "Services" },
] as const;

const mockConversations: Conversation[] = [
  {
    id: "group-1",
    type: "group",
    title: "March 15 Wedding — Grand Ballroom KL",
    subtitle: "You, Aisha Rahman, Hassan Catering, Lisa Photography",
    avatar: "G",
    participants: [
      { name: "Aisha Rahman", role: "Venue Owner", avatar: "A" },
      { name: "Hassan Catering", role: "Caterer", avatar: "H" },
      { name: "Lisa Photography", role: "Photographer", avatar: "L" },
    ],
    lastMessage: "Lisa Photography: I'll arrive at 4pm for the pre-ceremony shots.",
    lastTime: "30 min ago",
    unread: 3,
    eventBrief: {
      eventType: "Wedding Reception",
      date: "March 15, 2025",
      guests: 250,
      venue: "Grand Ballroom at The Majestic KL",
      requirements: "Halal catering required. Traditional Malay + Western fusion menu. Full-day photography coverage.",
    },
    messages: [
      { id: "gm1", sender: "system", text: "Group chat created — all services confirmed for your March 15 Wedding", time: "3 days ago" },
      { id: "gm2", sender: "system", text: "✓ Venue confirmed: Grand Ballroom at The Majestic KL", time: "3 days ago" },
      { id: "gm3", sender: "system", text: "✓ Catering confirmed: Hassan Premium Catering (250 pax)", time: "3 days ago" },
      { id: "gm4", sender: "system", text: "✓ Photography confirmed: Lisa Creative Photography", time: "3 days ago" },
      { id: "gm5", sender: "vendor", senderName: "Aisha Rahman", text: "Welcome everyone! Excited to host this wedding. I've pinned the event brief above for reference.", time: "3 days ago" },
      { id: "gm6", sender: "vendor", senderName: "Hassan Catering", text: "Assalamualaikum! I'll prepare the menu tasting for next week. @Aisha — can we use the kitchen on Tuesday for setup?", time: "2 days ago" },
      { id: "gm7", sender: "vendor", senderName: "Aisha Rahman", text: "Tuesday works! Kitchen is available from 10am.", time: "2 days ago" },
      { id: "gm8", sender: "customer", text: "This is great coordination! Quick question — can we do the solemnization at 3pm and reception at 6pm?", time: "1 day ago" },
      { id: "gm9", sender: "vendor", senderName: "Aisha Rahman", text: "Absolutely. We'll set up the solemnization area in the garden and transition to the ballroom for reception.", time: "1 day ago" },
      { id: "gm10", sender: "vendor", senderName: "Lisa Photography", text: "Perfect timing. I'll arrive at 4pm for the pre-ceremony shots.", time: "30 min ago" },
    ],
  },
  {
    id: "conv-venue-1",
    type: "venue",
    title: "Aisha Rahman",
    subtitle: "Grand Ballroom at The Majestic KL",
    avatar: "A",
    lastMessage: "Yes, we can accommodate 250 guests. I've sent you a quote.",
    lastTime: "2 days ago",
    unread: 0,
    messages: [
      { id: "vm1", sender: "system", text: "Inquiry sent — Wedding Reception, 250 guests, March 15 2025", time: "5 days ago" },
      { id: "vm2", sender: "vendor", senderName: "Aisha Rahman", text: "Thank you for your inquiry! We'd love to host your wedding at The Majestic.", time: "5 days ago" },
      { id: "vm3", sender: "customer", text: "Hi! Can you accommodate 250 guests with a halal menu?", time: "4 days ago" },
      { id: "vm4", sender: "vendor", senderName: "Aisha Rahman", text: "Yes, we can accommodate 250 guests. I've sent you a quote.", time: "4 days ago" },
      { id: "vm5", sender: "system", text: "Quote received: MYR 8,550 — Venue rental + AV + Stage + Parking", time: "4 days ago" },
      { id: "vm6", sender: "system", text: "✓ Booking confirmed — March 15, 2025", time: "3 days ago" },
    ],
  },
  {
    id: "conv-service-1",
    type: "service",
    title: "Hassan Catering",
    subtitle: "Catering · Halal Certified",
    avatar: "H",
    lastMessage: "Menu tasting scheduled for next Tuesday at 2pm.",
    lastTime: "1 day ago",
    unread: 0,
    messages: [
      { id: "sm1", sender: "system", text: "Event brief shared — Wedding Reception, 250 pax, Halal required", time: "3 days ago" },
      { id: "sm2", sender: "vendor", senderName: "Hassan Catering", text: "Waalaikumussalam! We'd be honored to cater your wedding. Our halal menu starts at RM 85/pax.", time: "3 days ago" },
      { id: "sm3", sender: "customer", text: "Can we do a fusion menu? Malay + Western?", time: "3 days ago" },
      { id: "sm4", sender: "vendor", senderName: "Hassan Catering", text: "Absolutely! Our fusion package is RM 95/pax. Includes 5-course meal with live cooking stations.", time: "2 days ago" },
      { id: "sm5", sender: "system", text: "Quote received: MYR 23,750 — 250 pax fusion menu", time: "2 days ago" },
      { id: "sm6", sender: "system", text: "✓ Service confirmed", time: "2 days ago" },
      { id: "sm7", sender: "vendor", senderName: "Hassan Catering", text: "Menu tasting scheduled for next Tuesday at 2pm.", time: "1 day ago" },
    ],
  },
  {
    id: "conv-service-2",
    type: "service",
    title: "Lisa Creative Photography",
    subtitle: "Photography · Full-day coverage",
    avatar: "L",
    lastMessage: "I'll send over the shot list template this week.",
    lastTime: "2 days ago",
    unread: 0,
    messages: [
      { id: "sp1", sender: "system", text: "Event brief shared — Wedding, March 15, Grand Ballroom KL", time: "3 days ago" },
      { id: "sp2", sender: "vendor", senderName: "Lisa Photography", text: "Hi! I'd love to capture your special day. I have the Premium package available — 12 hours, 2 photographers.", time: "3 days ago" },
      { id: "sp3", sender: "customer", text: "That sounds perfect! Does it include a pre-wedding shoot?", time: "3 days ago" },
      { id: "sp4", sender: "vendor", senderName: "Lisa Photography", text: "The Luxury package includes pre-wedding. RM 8,000 for full day + pre-wedding session.", time: "3 days ago" },
      { id: "sp5", sender: "system", text: "Quote received: MYR 8,000 — Luxury package", time: "3 days ago" },
      { id: "sp6", sender: "system", text: "✓ Service confirmed", time: "2 days ago" },
      { id: "sp7", sender: "vendor", senderName: "Lisa Photography", text: "I'll send over the shot list template this week.", time: "2 days ago" },
    ],
  },
];

export default function MessagesPage() {
  const [activeConversation, setActiveConversation] = useState<string | null>(mockConversations[0]?.id ?? null);
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState(mockConversations);
  const [filter, setFilter] = useState<"all" | "group" | "venue" | "service">("all");

  const filtered = conversations.filter((c) => filter === "all" ? true : c.type === filter);
  const activeConv = conversations.find((c) => c.id === activeConversation);

  const handleSend = () => {
    if (!newMessage.trim() || !activeConversation) return;
    const msg: Message = { id: `m-${Date.now()}`, sender: "customer", text: newMessage.trim(), time: "Just now" };
    setConversations((prev) =>
      prev.map((c) => c.id === activeConversation ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, lastTime: "Just now" } : c)
    );
    setNewMessage("");
  };

  const typeIcon = (type: ConversationType) => {
    if (type === "group") return "👥";
    if (type === "venue") return "🏛️";
    return "🔧";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EB4D4B] text-xs font-bold text-white">EV</span>
            EventVenue<span className="text-[#EB4D4B]">.Asia</span>
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">← Back to Dashboard</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm" style={{ height: "calc(100vh - 160px)" }}>
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-80 shrink-0 border-r border-gray-200 flex flex-col">
              <div className="border-b border-gray-200 p-4">
                <h2 className="text-lg font-bold text-gray-900">Messages</h2>
                <div className="mt-3 flex gap-1">
                  {filterTabs.map((tab) => (
                    <button key={tab.key} onClick={() => setFilter(tab.key)} className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${filter === tab.key ? "bg-[#EB4D4B] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filtered.map((conv) => (
                  <button key={conv.id} onClick={() => setActiveConversation(conv.id)} className={`flex w-full items-start gap-3 border-b border-gray-100 p-4 text-left transition-colors ${activeConversation === conv.id ? "bg-red-50/50" : "hover:bg-gray-50"}`}>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${conv.type === "group" ? "bg-purple-500" : activeConversation === conv.id ? "bg-[#EB4D4B]" : "bg-gray-400"}`}>{conv.avatar}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{conv.title}</p>
                        {conv.unread > 0 && <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EB4D4B] text-[10px] font-bold text-white">{conv.unread}</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 truncate">{conv.subtitle}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px]">{typeIcon(conv.type)}</span>
                        <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {activeConv ? (
              <div className="flex flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${activeConv.type === "group" ? "bg-purple-500" : "bg-[#EB4D4B]"}`}>{activeConv.avatar}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{activeConv.title}</p>
                      {activeConv.type === "group" && activeConv.participants && (<div className="flex items-center gap-1 mt-0.5">{activeConv.participants.map((p) => (<span key={p.name} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">{p.role}</span>))}</div>)}
                      {activeConv.type !== "group" && <p className="text-xs text-gray-500">{activeConv.subtitle}</p>}
                    </div>
                  </div>
                </div>
                {activeConv.type === "group" && activeConv.eventBrief && (
                  <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
                    <div className="flex items-center gap-2"><svg className="h-4 w-4 text-[#EB4D4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg><span className="text-xs font-semibold text-gray-700">Event Brief</span></div>
                    <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                      <span className="text-gray-400">Event: <span className="text-gray-700 font-medium">{activeConv.eventBrief.eventType}</span></span>
                      <span className="text-gray-400">Date: <span className="text-gray-700 font-medium">{activeConv.eventBrief.date}</span></span>
                      <span className="text-gray-400">Guests: <span className="text-gray-700 font-medium">{activeConv.eventBrief.guests} pax</span></span>
                      <span className="text-gray-400">Venue: <span className="text-gray-700 font-medium">{activeConv.eventBrief.venue}</span></span>
                      <span className="col-span-2 text-gray-400">Notes: <span className="text-gray-700">{activeConv.eventBrief.requirements}</span></span>
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {activeConv.messages.map((msg) => {
                    if (msg.sender === "system") return (<div key={msg.id} className="flex justify-center"><span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">{msg.text}</span></div>);
                    const isMe = msg.sender === "customer";
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
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }} placeholder={activeConv.type === "group" ? "Message the group..." : "Type a message..."} className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20" />
                    <button onClick={handleSend} disabled={!newMessage.trim()} className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EB4D4B] text-white transition-all hover:bg-[#dc2626] disabled:opacity-40"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center"><p className="text-sm text-gray-400">Select a conversation</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
