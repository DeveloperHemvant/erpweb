"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { MessageSquare, Send } from "lucide-react";

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <MessagesPageContent />
    </Suspense>
  );
}

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const parentId = searchParams.get("id");
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (parentId) {
      fetch(`${API_URL}/communication/chat/conversations/${parentId}`)
        .then(res => res.json())
        .then(data => {
          setConversations(data);
          if (data.length > 0) {
            setActiveConvId(data[0].id);
          }
        })
        .catch(() => toast("Failed to load conversations", { type: "error" }));
    }
  }, [parentId]);

  useEffect(() => {
    if (activeConvId) {
      fetch(`${API_URL}/communication/chat/${activeConvId}/messages`)
        .then(res => res.json())
        .then(setMessages);
    }
  }, [activeConvId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvId) return;

    try {
      const res = await fetch(`${API_URL}/communication/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          senderId: parentId,
          senderType: "PARENT",
          content: newMessage
        })
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages([...messages, msg]);
        setNewMessage("");
      }
    } catch {
      toast("Failed to send message", { type: "error" });
    }
  };

  return (
    <div className="flex h-[80vh] gap-4">
      {/* Sidebar: Conversations List */}
      <Card className="w-1/3 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5"/> Threads</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0 border-t">
          {conversations.length === 0 ? (
            <div className="p-4 text-sm text-text-secondary">No conversations started.</div>
          ) : (
            <div className="flex flex-col divide-y">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    activeConvId === conv.id ? "bg-slate-50 dark:bg-slate-800 border-l-4 border-primary" : ""
                  }`}
                >
                  <div className="font-semibold text-sm">Staff ID: {conv.staffId.slice(0, 8)}...</div>
                  <div className="text-xs text-text-secondary truncate mt-1">
                    {conv.messages && conv.messages[0] ? conv.messages[0].content : "No messages yet"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Chat Area */}
      <Card className="w-2/3 flex flex-col">
        {activeConvId ? (
          <>
            <CardHeader className="border-b bg-slate-50 dark:bg-slate-800 py-3">
              <CardTitle className="text-lg">Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => {
                const isMe = msg.senderType === "PARENT";
                return (
                  <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] p-3 rounded-xl text-sm ${
                      isMe 
                        ? "bg-primary text-white rounded-tr-sm" 
                        : "bg-slate-100 dark:bg-slate-700 text-text-primary rounded-tl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </CardContent>
            <div className="p-3 border-t bg-slate-50 dark:bg-slate-800">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  className="flex-1 bg-white dark:bg-slate-900"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <Button type="submit" variant="primary" disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            Select a conversation to start chatting
          </div>
        )}
      </Card>
    </div>
  );
}
