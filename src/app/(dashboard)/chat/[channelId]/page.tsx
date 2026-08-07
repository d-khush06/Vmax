"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquarePlus, Smile, Download, FileText, Image as ImageIcon, File, Loader2, Paperclip, Pencil, Trash2, X, Check } from 'lucide-react';
import EmojiPicker, { Emoji, EmojiStyle, Theme } from 'emoji-picker-react';
import emojiRegex from 'emoji-regex';
import { useTeam } from '@/lib/team-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';

export default function ChatPage() {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const { team, user } = useTeam();
  const pickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
          setShowEmojiPicker(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderTextWithAppleEmojis = (text: string) => {
    if (!text) return null;
    const regex = emojiRegex();
    const parts = text.split(regex);
    const matches = text.match(regex) || [];
    
    return parts.map((part, i) => {
      const emoji = matches[i];
      let unified = '';
      if (emoji) {
        unified = Array.from(emoji).map(c => c.codePointAt(0)?.toString(16)).join('-');
      }
      return (
        <React.Fragment key={i}>
          {part}
          {emoji && <Emoji unified={unified} emojiStyle={EmojiStyle.APPLE} size={20} />}
        </React.Fragment>
      );
    });
  };

  const messages = useQuery(api.messages.list, team ? { teamId: team._id } : "skip");
  const sendMessage = useMutation(api.messages.send);
  const updateMessage = useMutation(api.messages.update);
  const removeMessage = useMutation(api.messages.remove);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleDelete = async (msgId: string) => {
    if (!user) return;
    try {
      await removeMessage({ messageId: msgId as any, clerkId: user.id });
    } catch (err: any) {
      alert('Failed to delete message: ' + err.message);
    }
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!user || !editContent.trim()) {
      setEditingMessageId(null);
      return;
    }
    try {
      await updateMessage({ messageId: msgId as any, content: editContent, clerkId: user.id });
      setEditingMessageId(null);
    } catch (err: any) {
      alert('Failed to update message: ' + err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !team || !user) return;

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();

      await sendMessage({ 
        teamId: team._id, 
        content: '', 
        clerkId: user.id,
        fileStorageId: storageId,
        fileName: file.name,
        fileType: file.type || 'unknown'
      });
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
      <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-gray-400 bg-white/5 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10">
        <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]"></div>
        Real-time Active
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar pt-16">
        {messages === undefined ? (
           <div className="h-full flex items-center justify-center text-gray-500">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <MessageSquarePlus size={48} className="mb-4 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg: any, i: number) => {
            const isMe = msg.users?.clerkId === user?.id;
            return (
              <div key={msg._id} className="group flex gap-4 hover:bg-white/[0.04] px-4 py-3 -mx-4 rounded-2xl transition-all border border-transparent hover:border-white/5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-md relative">
                
                {isMe && !editingMessageId && (
                  <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg p-1 shadow-lg z-10">
                    <button onClick={() => { setEditingMessageId(msg._id); setEditContent(msg.content); }} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-teal-400 transition-colors" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(msg._id)} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <img 
                  src={msg.users?.avatar_url || `https://i.pravatar.cc/150?u=${i}`} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-xl border border-white/10 shrink-0 mt-0.5 shadow-md" 
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-semibold ${isMe ? 'text-teal-400' : 'text-gray-200'}`}>
                      {isMe ? 'You' : (msg.users?.full_name || 'Member')}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.isEdited && <span className="ml-1 opacity-75">(edited)</span>}
                    </span>
                  </div>
                  {editingMessageId === msg._id ? (
                    <div className="mt-1 flex items-center gap-2">
                      <input 
                        type="text" 
                        autoFocus
                        value={editContent} 
                        onChange={(e) => setEditContent(e.target.value)} 
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(msg._id); else if (e.key === 'Escape') setEditingMessageId(null); }}
                        className="flex-1 bg-black/20 border border-white/20 rounded-lg px-3 py-1.5 text-[15px] text-white focus:outline-none focus:border-teal-500" 
                      />
                      <button onClick={() => handleSaveEdit(msg._id)} className="p-1.5 bg-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-white rounded-md transition-colors"><Check size={16} /></button>
                      <button onClick={() => setEditingMessageId(null)} className="p-1.5 bg-white/5 text-gray-400 hover:bg-white/20 hover:text-white rounded-md transition-colors"><X size={16} /></button>
                    </div>
                  ) : (
                    <>
                      {msg.content && (
                        <p className="text-gray-300 text-[15px] leading-relaxed mt-0.5 whitespace-pre-wrap break-words flex items-center flex-wrap gap-x-0.5">
                          {renderTextWithAppleEmojis(msg.content)}
                        </p>
                      )}
                    </>
                  )}
                  {msg.fileUrl && msg.fileName && (
                    <div className="mt-2 flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 max-w-sm hover:bg-white/10 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center border border-teal-500/30 text-teal-400">
                        {msg.fileType?.includes('image') ? <ImageIcon size={20} /> : msg.fileType?.includes('pdf') ? <FileText size={20} /> : <File size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{msg.fileName}</p>
                        <p className="text-xs text-gray-500 uppercase">{msg.fileType?.split('/')[1] || 'FILE'}</p>
                      </div>
                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white transition-colors" title="Download">
                        <Download size={16} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-white/[0.01] backdrop-blur-xl shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-3 relative max-w-4xl mx-auto w-full">
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 rounded-2xl overflow-hidden border border-white/10" ref={pickerRef}>
              <EmojiPicker 
                onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)}
                theme={Theme.DARK}
                emojiStyle={EmojiStyle.APPLE}
              />
            </div>
          )}
          
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-400 hover:text-teal-400 transition-colors"
            >
              <Smile size={20} />
            </button>
          </div>
          
          <div className="relative flex-1">
            <div 
               className="absolute inset-0 pointer-events-none pl-12 pr-20 py-3.5 text-[15px] flex items-center whitespace-nowrap overflow-hidden"
               aria-hidden="true"
               ref={overlayRef}
            >
               {newMessage ? (
                 <span className="text-gray-200 flex items-center gap-x-[1px]">{renderTextWithAppleEmojis(newMessage)}</span>
               ) : (
                 <span className="text-gray-500 text-sm">Message team...</span>
               )}
            </div>
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onScroll={(e) => { if (overlayRef.current) overlayRef.current.scrollLeft = (e.target as HTMLInputElement).scrollLeft; }}
              className="w-full h-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-20 py-3.5 text-[15px] text-transparent caret-white placeholder-transparent focus:outline-none focus:border-teal-500/50 focus:bg-white/[0.05] transition-all shadow-inner relative z-10 font-sans"
            />
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-400 transition-colors z-10 disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin text-teal-400" /> : <Paperclip size={18} />}
          </button>

          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-teal-500 hover:bg-teal-400 text-white w-9 h-9 rounded-lg transition-all flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.3)]"
          >
            <Send size={16} className="-ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
