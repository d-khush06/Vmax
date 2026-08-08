"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquarePlus, Smile, Download, FileText, Image as ImageIcon, File, Loader2, Paperclip, Pencil, Trash2, X, Check } from 'lucide-react';
import EmojiPicker, { Emoji, EmojiStyle, Theme } from 'emoji-picker-react';
import emojiRegex from 'emoji-regex';
import { useTeam } from '@/lib/team-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="flex flex-col h-full w-full relative bg-[#0a0a0a]">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      {/* Connection Status indicator */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute top-6 right-6 flex items-center gap-2 text-xs font-medium text-teal-100/70 bg-white/5 backdrop-blur-2xl px-4 py-2 rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-10"
      >
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
        </div>
        Real-time Active
      </motion.div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar pt-20 z-10">
        {messages === undefined ? (
           <div className="h-full flex items-center justify-center">
             <Loader2 size={32} className="animate-spin text-teal-500/50" />
           </div>
        ) : messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center text-gray-500"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
              <MessageSquarePlus size={32} className="text-teal-500/70" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Welcome to the channel</h3>
            <p className="text-sm text-gray-500 max-w-sm text-center leading-relaxed">This is the start of something great. Send a message to get the conversation started.</p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
          {messages.map((msg: any, i: number) => {
            const isMe = msg.users?.clerkId === user?.id;
            return (
              <motion.div 
                key={msg._id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3 }}
                className="group flex gap-4 hover:bg-white/[0.02] px-6 py-4 -mx-6 rounded-3xl transition-all border border-transparent hover:border-white/5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative"
              >
                
                {isMe && !editingMessageId && (
                  <div className="absolute right-6 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1 shadow-2xl z-10">
                    <button onClick={() => { setEditingMessageId(msg._id); setEditContent(msg.content); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-teal-400 transition-colors" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(msg._id)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div className="relative shrink-0">
                  <img 
                    src={msg.users?.avatar_url || `https://i.pravatar.cc/150?u=${i}`} 
                    alt="Avatar" 
                    className="w-11 h-11 rounded-2xl border border-white/10 shadow-lg object-cover" 
                  />
                  {isMe && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-teal-500 border-2 border-[#0a0a0a] rounded-full"></div>}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className={`font-semibold tracking-wide text-[15px] ${isMe ? 'text-teal-400' : 'text-gray-200'}`}>
                      {isMe ? 'You' : (msg.users?.full_name || 'Member')}
                    </span>
                    <span className="text-xs font-medium text-gray-500/80">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.isEdited && <span className="ml-1.5 italic opacity-70">(edited)</span>}
                    </span>
                  </div>
                  {editingMessageId === msg._id ? (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10"
                    >
                      <input 
                        type="text" 
                        autoFocus
                        value={editContent} 
                        onChange={(e) => setEditContent(e.target.value)} 
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(msg._id); else if (e.key === 'Escape') setEditingMessageId(null); }}
                        className="flex-1 bg-transparent border-none px-2 py-1 text-[15px] text-white focus:outline-none focus:ring-0 placeholder-gray-500" 
                      />
                      <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                        <button onClick={() => handleSaveEdit(msg._id)} className="p-1.5 bg-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-white rounded-lg transition-all"><Check size={16} /></button>
                        <button onClick={() => setEditingMessageId(null)} className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all"><X size={16} /></button>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {msg.content && (
                        <p className="text-gray-300/90 text-[15px] leading-relaxed mt-0.5 whitespace-pre-wrap break-words flex items-center flex-wrap gap-x-0.5">
                          {renderTextWithAppleEmojis(msg.content)}
                        </p>
                      )}
                    </>
                  )}
                  {msg.fileUrl && msg.fileName && (
                    <div className="mt-3 flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 max-w-sm hover:bg-white/[0.06] hover:border-white/10 transition-all group/file shadow-sm">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 flex items-center justify-center border border-teal-500/20 text-teal-400 shadow-inner">
                        {msg.fileType?.includes('image') ? <ImageIcon size={22} /> : msg.fileType?.includes('pdf') ? <FileText size={22} /> : <File size={22} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate group-hover/file:text-teal-100 transition-colors">{msg.fileName}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">{msg.fileType?.split('/')[1] || 'FILE'}</p>
                      </div>
                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 hover:bg-teal-500 hover:text-white text-gray-400 transition-all shadow-sm" title="Download">
                        <Download size={18} />
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        )}
      </div>

      <div className="p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent z-20 pb-8">
        <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto w-full group">
          {showEmojiPicker && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute bottom-full left-0 mb-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 rounded-2xl overflow-hidden border border-white/10" 
              ref={pickerRef}
            >
              <EmojiPicker 
                onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)}
                theme={Theme.DARK}
                emojiStyle={EmojiStyle.APPLE}
              />
            </motion.div>
          )}
          
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-400 hover:text-teal-400 hover:bg-white/5 rounded-full transition-all"
            >
              <Smile size={22} />
            </button>
          </div>
          
          <div className="relative w-full rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.2)] focus-within:border-teal-500/50 focus-within:bg-white/[0.04] focus-within:shadow-[0_0_30px_rgba(20,184,166,0.15)] transition-all overflow-hidden flex items-center">
            <div 
               className="absolute inset-0 pointer-events-none pl-[60px] pr-[100px] py-4 text-[15px] flex items-center whitespace-nowrap overflow-hidden"
               aria-hidden="true"
               ref={overlayRef}
            >
               {newMessage ? (
                 <span className="text-gray-200 flex items-center gap-x-[1px]">{renderTextWithAppleEmojis(newMessage)}</span>
               ) : (
                 <span className="text-gray-500/80 font-medium tracking-wide">Message your team...</span>
               )}
            </div>
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onScroll={(e) => { if (overlayRef.current) overlayRef.current.scrollLeft = (e.target as HTMLInputElement).scrollLeft; }}
              className="w-full h-full bg-transparent pl-[60px] pr-[100px] py-4 text-[15px] text-transparent caret-teal-400 placeholder-transparent focus:outline-none relative z-10 font-sans"
            />
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-2 text-gray-400 hover:text-teal-400 hover:bg-white/5 rounded-full transition-all disabled:opacity-50"
            >
              {isUploading ? <Loader2 size={20} className="animate-spin text-teal-400" /> : <Paperclip size={20} />}
            </button>

            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-gradient-to-br from-teal-400 to-teal-600 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 text-white w-10 h-10 rounded-xl transition-all flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.4)] disabled:shadow-none hover:scale-105 active:scale-95"
            >
              <Send size={18} className="-ml-0.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
