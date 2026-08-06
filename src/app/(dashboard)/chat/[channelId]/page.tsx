"use client"

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useTeam } from '@/lib/team-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';

export default function ChatPage() {
  const [newMessage, setNewMessage] = useState('');
  const { team, user } = useTeam();

  const messages = useQuery(api.messages.list, team ? { teamId: team._id } : "skip");
  const sendMessage = useMutation(api.messages.send);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !team || !user) return;

    const content = newMessage;
    setNewMessage(''); // optimistic clear

    try {
      await sendMessage({ teamId: team._id, content, clerkId: user.id });
    } catch (err: any) {
      alert('Failed to send message: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Connection Status indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-gray-400 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md z-10">
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
        Real-time Active (Convex)
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar pt-16">
        {messages === undefined ? (
           <div className="h-full flex items-center justify-center text-gray-500">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <span className="text-4xl mb-4">💬</span>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg: any, i: number) => (
            <div key={msg._id} className="flex gap-4">
              <img src={msg.users?.avatar_url || `https://i.pravatar.cc/150?u=${i}`} alt="Avatar" className="w-10 h-10 rounded-full border border-white/10" />
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-indigo-300">{msg.users?.full_name || 'Member'}</span>
                  <span className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-gray-300 bg-white/5 px-4 py-2 rounded-2xl rounded-tl-sm mt-1 border border-white/5 shadow-sm">
                  {msg.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-transparent shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-3 relative max-w-4xl mx-auto w-full">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message team..." 
            className="flex-1 bg-white/[0.03] border border-white/5 rounded-full px-6 py-3.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all shadow-inner"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-gray-300 w-9 h-9 rounded-full transition-all flex items-center justify-center border border-white/10"
          >
            <Send size={16} className="-ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
