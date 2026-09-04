"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquarePlus, Smile, Download, FileText, Image as ImageIcon, File, Loader2, Paperclip, Pencil, Trash2, X, Check, Mic, Reply, SmilePlus, Link as LinkIcon, Code, BarChart2, Sticker } from 'lucide-react';
import EmojiPicker, { Emoji, EmojiStyle, Theme } from 'emoji-picker-react';
import emojiRegex from 'emoji-regex';
import { useTeam } from '@/lib/team-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const LinkPreview = ({ url }: { url: string }) => {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(res => { if (res.status === 'success') setData(res.data); })
      .catch(() => {});
  }, [url]);
  if (!data) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-3 max-w-sm rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all overflow-hidden group/link shadow-lg">
      {data.image?.url && <img src={data.image.url} alt={data.title} className="w-full h-32 object-cover border-b border-white/10" />}
      <div className="p-3 bg-black/20">
        <h4 className="text-sm font-bold text-gray-200 line-clamp-1">{data.title}</h4>
        {data.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{data.description}</p>}
        <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-2 block">{new URL(url).hostname}</span>
      </div>
    </a>
  );
};

export default function ChatPage() {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState<any>(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [showGifModal, setShowGifModal] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifResults, setGifResults] = useState<string[]>([]);
  const [isSearchingGif, setIsSearchingGif] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { team, user } = useTeam();
  const { user: clerkUser } = useUser();
  const pickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (showGifModal && gifResults.length === 0) {
      const fetchTrending = async () => {
        setIsSearchingGif(true);
        try {
          const res = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=dc6zaTOxFJmzC&limit=12&rating=pg-13`);
          const data = await res.json();
          if (data.data) {
            setGifResults(data.data.map((g: any) => g.images.fixed_height.url));
          }
        } catch(e) {}
        setIsSearchingGif(false);
      };
      fetchTrending();
    }
  }, [showGifModal]);

  const handleSearchGif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gifSearch.trim()) return;
    setIsSearchingGif(true);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(gifSearch)}&limit=12&rating=pg-13`);
      const data = await res.json();
      if (data.data) {
        setGifResults(data.data.map((g: any) => g.images.fixed_height.url));
      }
    } catch(e) {}
    setIsSearchingGif(false);
  };

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

  const renderMessageContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const content = part.slice(3, -3);
        const firstLineEnd = content.indexOf('\n');
        const language = firstLineEnd > -1 ? content.slice(0, firstLineEnd).trim() : '';
        const code = firstLineEnd > -1 ? content.slice(firstLineEnd + 1) : content;
        return (
          <div key={i} className="my-2 rounded-xl overflow-hidden border border-white/10 shadow-lg relative group/code w-full max-w-3xl">
            <div className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
              <button onClick={() => navigator.clipboard.writeText(code)} className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs text-white/70 hover:text-white backdrop-blur-md flex items-center gap-1">
                <Code size={12} /> Copy
              </button>
            </div>
            <SyntaxHighlighter language={language || 'text'} style={vscDarkPlus} customStyle={{ margin: 0, padding: '16px', background: 'rgba(0,0,0,0.4)', fontSize: '13px' }}>
              {code}
            </SyntaxHighlighter>
          </div>
        );
      }
      
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = part.match(urlRegex) || [];
      const textParts = part.split(urlRegex);
      return (
        <div key={i} className="flex flex-col w-full">
          <span className="whitespace-pre-wrap flex items-center flex-wrap gap-x-0.5">
            {textParts.map((t, j) => {
              if (t.match(urlRegex)) {
                if (t.match(/\.(gif|mp4|webm|jpg|jpeg|png)$/i) || t.includes('giphy.com/media/')) {
                  return null;
                }
                return <a key={j} href={t} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{renderTextWithAppleEmojis(t)}</a>;
              }
              const mentionRegex = /(@\w+)/g;
              if (t.match(mentionRegex)) {
                 const mParts = t.split(mentionRegex);
                 return mParts.map((mt, k) => {
                    if (mt.startsWith('@')) {
                      return <span key={`m-${k}`} className="bg-blue-500/20 text-blue-400 px-1 rounded-md">{mt}</span>;
                    }
                    return renderTextWithAppleEmojis(mt);
                 });
              }
              return renderTextWithAppleEmojis(t);
            })}
          </span>
          {urls.length > 0 && urls.map((url, j) => {
             if (url.match(/\.(gif|mp4|webm|jpg|jpeg|png)$/i) || url.includes('giphy.com/media/')) {
                return (
                   <div key={`img-${j}`} className="mt-2 rounded-2xl overflow-hidden border border-white/10 shadow-lg inline-block max-w-sm">
                     <img src={url} alt="Media" className="w-full h-auto object-cover" />
                   </div>
                );
             }
             return <LinkPreview key={`url-${j}`} url={url} />;
          })}
        </div>
      );
    });
  };

  const messages = useQuery(api.messages.list, team ? { teamId: team._id } : "skip");
  const sendMessage = useMutation(api.messages.send);
  const updateMessage = useMutation(api.messages.update);
  const removeMessage = useMutation(api.messages.remove);
  const toggleReaction = useMutation(api.messages.toggleReaction);
  const votePoll = useMutation(api.messages.votePoll);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  
  const setTyping = useMutation(api.typing.setTyping);
  const typingUsers = useQuery(api.typing.getTypingUsers, team && user ? { teamId: team._id, currentUserId: user.id } : "skip");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = (text: string) => {
    setNewMessage(text);
    if (!team || !user) return;
    
    // Set typing to true
    setTyping({ teamId: team._id, clerkId: user.id, isTyping: true });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    // Set typing to false after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping({ teamId: team._id, clerkId: user.id, isTyping: false });
    }, 2000);
  };

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
    const replyId = replyingToMessage?._id;
    
    setNewMessage(''); // optimistic clear
    setReplyingToMessage(null);

    // Slash Commands
    if (content.startsWith('/poll ')) {
       const args = content.replace('/poll ', '').split('|').map(s => s.trim());
       if (args.length >= 3) {
         const question = args[0];
         const options = args.slice(1).map((opt, i) => ({ id: `opt-${i}`, text: opt, votes: [] }));
         try {
           await sendMessage({ teamId: team._id, content: question, clerkId: user.id, isPoll: true, pollOptions: options, ...(replyId ? { replyToMessageId: replyId as any } : {}) });
           return;
         } catch (e: any) { alert(e.message); return; }
       }
    }
    
    if (content.startsWith('/gif ')) {
       const search = content.replace('/gif ', '').trim();
       try {
         const res = await fetch(`https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=${encodeURIComponent(search)}&rating=pg-13`);
         const data = await res.json();
         if (data.data?.images?.original?.url) {
           await sendMessage({ teamId: team._id, content: data.data.images.original.url, clerkId: user.id, ...(replyId ? { replyToMessageId: replyId as any } : {}) }); 
         }
       } catch (e) {}
       return;
    }

    try {
      await sendMessage({ 
        teamId: team._id, 
        content, 
        clerkId: user.id,
        ...(replyId ? { replyToMessageId: replyId as any } : {})
      });
    } catch (err: any) {
      alert('Failed to send message: ' + err.message);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop()); // release mic
        
        if (audioBlob.size > 0 && team && user) {
          setIsUploading(true);
          try {
            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": "audio/webm" }, body: audioBlob });
            if (!result.ok) throw new Error("Upload failed");
            const { storageId } = await result.json();
            
            await sendMessage({ 
              teamId: team._id, 
              content: 'Sent a voice note 🎤', 
              clerkId: user.id,
              fileStorageId: storageId,
              fileName: `Voice Note - ${new Date().toLocaleTimeString()}.webm`,
              fileType: 'audio/webm'
            });
          } catch (err: any) {
             alert('Failed to upload voice note: ' + err.message);
          } finally {
             setIsUploading(false);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  return (
    <div className="flex flex-col h-full w-full relative bg-transparent font-medium tracking-wide">

      {/* Connection Status indicator */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute top-6 right-6 flex items-center gap-2 text-xs font-medium text-green-100/70 bg-white/5 backdrop-blur-2xl px-4 py-2 rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-10"
      >
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </div>
        Real-time Active
      </motion.div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar pt-20 z-10">
        {messages === undefined ? (
           <div className="h-full flex items-center justify-center">
             <Loader2 size={32} className="animate-spin text-green-500/50" />
           </div>
        ) : messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center text-gray-500"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
              <MessageSquarePlus size={32} className="text-green-500/70" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Welcome to the channel</h3>
            <p className="text-sm text-gray-500 max-w-sm text-center leading-relaxed">This is the start of something great. Send a message to get the conversation started.</p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
          {messages.map((msg: any, i: number) => {
            const isMe = msg.users?.clerkId === clerkUser?.id || msg.users?.clerkId === user?.clerkId;
            const avatarUrl = isMe 
              ? clerkUser?.imageUrl 
              : (msg.users?.avatar_url || msg.users?.avatarUrl || '/logo.png');

            return (
              <motion.div 
                key={msg._id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3 }}
                className="group flex gap-4 hover:bg-white/[0.05] px-6 py-4 -mx-6 rounded-3xl transition-all border border-transparent hover:border-white/10 hover:shadow-xl relative backdrop-blur-sm hover:backdrop-blur-md"
              >
                <div className="absolute right-6 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-1 shadow-2xl z-10">
                  <div className="flex items-center border-r border-white/10 pr-1 mr-1">
                    {['👍', '❤️', '😂', '🔥', '🚀'].map(emoji => (
                      <button key={emoji} onClick={() => toggleReaction({ messageId: msg._id, emoji, clerkId: user!.id })} className="p-1.5 hover:bg-white/10 rounded-lg transition-transform hover:scale-125 flex items-center justify-center">
                        {renderTextWithAppleEmojis(emoji)}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setReplyingToMessage(msg)} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors flex items-center gap-1" title="Reply">
                    <Reply size={14} />
                  </button>
                  {isMe && !editingMessageId && (
                    <>
                      <button onClick={() => { setEditingMessageId(msg._id); setEditContent(msg.content); }} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(msg._id)} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>

                <div className="relative shrink-0 mt-0.5">
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-10 h-10 rounded-full border border-white/20 shadow-lg object-cover" 
                  />
                  {isMe && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 border-2 border-[#000000] rounded-full"></div>}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className={`font-semibold tracking-wide text-[15px] ${isMe ? 'text-blue-400' : 'text-white'}`}>
                      {isMe ? 'You' : (msg.users?.full_name || msg.users?.name || 'Member')}
                    </span>
                    <span className="text-xs font-medium text-gray-500/80">
                      {new Date(msg._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.isEdited && <span className="ml-1.5 italic opacity-70">(edited)</span>}
                    </span>
                  </div>
                  
                  {msg.replyToMessage && (
                    <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => document.getElementById(`msg-${msg.replyToMessage._id}`)?.scrollIntoView({ behavior: 'smooth' })}>
                      <div className="w-1 h-4 bg-blue-500 rounded-full" />
                      <span className="text-xs font-semibold text-gray-400">
                        {msg.replyToMessage.users?.full_name || 'Someone'}
                      </span>
                      <span className="text-xs text-gray-500 line-clamp-1 truncate max-w-sm">
                        {msg.replyToMessage.content}
                      </span>
                    </div>
                  )}

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
                        <button onClick={() => handleSaveEdit(msg._id)} className="p-1.5 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-lg transition-all"><Check size={16} /></button>
                        <button onClick={() => setEditingMessageId(null)} className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all"><X size={16} /></button>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {msg.content && (
                        <div className="text-gray-200 text-[15px] leading-relaxed mt-0.5 font-medium tracking-wide">
                          {renderMessageContent(msg.content)}
                        </div>
                      )}
                    </>
                  )}
                  {msg.fileUrl && msg.fileName && (
                    <div className="mt-3">
                      {msg.fileType?.includes('image') ? (
                        <div 
                          className="relative max-w-sm rounded-2xl overflow-hidden cursor-zoom-in group/img shadow-md border border-white/10"
                          onClick={() => setLightboxImage(msg.fileUrl)}
                        >
                          <img src={msg.fileUrl} alt={msg.fileName} className="w-full h-auto object-cover max-h-[300px] transition-transform duration-500 group-hover/img:scale-105" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <ImageIcon size={32} className="text-white drop-shadow-lg" />
                          </div>
                        </div>
                      ) : msg.fileType?.includes('audio') ? (
                        <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 max-w-sm hover:bg-white/[0.06] hover:border-white/10 transition-all group/file shadow-sm">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 shadow-inner">
                            <Mic size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <audio controls src={msg.fileUrl} className="h-8 w-full outline-none" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 max-w-sm hover:bg-white/[0.06] hover:border-white/10 transition-all group/file shadow-sm">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center border border-green-500/20 text-green-400 shadow-inner">
                            {msg.fileType?.includes('pdf') ? <FileText size={22} /> : <File size={22} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate group-hover/file:text-green-100 transition-colors">{msg.fileName}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">{msg.fileType?.split('/')[1] || 'FILE'}</p>
                          </div>
                          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 hover:bg-green-500 hover:text-white text-gray-400 transition-all shadow-sm" title="Download">
                            <Download size={18} />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {msg.reactions.map((r: any) => {
                        const hasReacted = r.clerkIds.includes(user?.id);
                        return (
                          <button
                            key={r.emoji}
                            onClick={() => toggleReaction({ messageId: msg._id, emoji: r.emoji, clerkId: user!.id })}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium border transition-all ${hasReacted ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                          >
                            <span className="flex items-center justify-center">{renderTextWithAppleEmojis(r.emoji)}</span>
                            <span>{r.clerkIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {msg.isPoll && msg.pollOptions && (
                    <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 max-w-sm">
                      <div className="flex items-center gap-2 mb-3 text-blue-400">
                        <BarChart2 size={18} />
                        <span className="font-bold uppercase tracking-wider text-xs">Poll</span>
                      </div>
                      <div className="space-y-2">
                        {msg.pollOptions.map((opt: any) => {
                          const totalVotes = msg.pollOptions.reduce((acc: number, o: any) => acc + o.votes.length, 0);
                          const myVote = opt.votes.includes(user?.id);
                          const percentage = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                          return (
                            <button 
                              key={opt.id}
                              onClick={() => votePoll({ messageId: msg._id, optionId: opt.id, clerkId: user!.id })}
                              className={`w-full relative overflow-hidden rounded-xl border p-3 text-left transition-all ${myVote ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                            >
                              <div className="absolute inset-y-0 left-0 bg-white/5" style={{ width: `${percentage}%` }} />
                              <div className="relative flex items-center justify-between z-10">
                                <span className={`text-sm font-medium ${myVote ? 'text-blue-300' : 'text-gray-300'}`}>{opt.text}</span>
                                <span className="text-xs text-gray-500">{percentage}%</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <AnimatePresence>
        {typingUsers && typingUsers.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-24 left-10 flex items-center gap-2 text-gray-400 text-[13px] font-medium z-10 bg-black/40 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/5"
          >
            <div className="flex gap-1.5 items-center mr-1">
              <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            </div>
            {typingUsers.map((t: any) => t.user?.full_name?.split(' ')[0] || 'Someone').join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 bg-white/5 backdrop-blur-[60px] border-t border-white/20 z-20 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] flex flex-col">
        {replyingToMessage && (
          <div className="max-w-4xl mx-auto w-full mb-3 flex items-center justify-between bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-xl">
            <div className="flex items-center gap-2 text-gray-300 text-[13px]">
              <Reply size={16} className="text-blue-400" />
              <span className="font-semibold text-blue-400">Replying to {replyingToMessage.users?.full_name || 'Someone'}</span>
              <span className="text-gray-400 truncate max-w-sm ml-2">{replyingToMessage.content}</span>
            </div>
            <button onClick={() => setReplyingToMessage(null)} className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        )}
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
              className="p-2 text-gray-400 hover:text-green-400 hover:bg-white/5 rounded-full transition-all"
            >
              <Smile size={22} />
            </button>
          </div>
          
          <div className="relative w-full rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl focus-within:border-blue-500/50 focus-within:bg-white/[0.15] focus-within:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all overflow-hidden flex items-center">
            <div 
               className="absolute inset-0 pointer-events-none pl-[60px] pr-[100px] py-4 text-[15px] flex items-center whitespace-nowrap overflow-hidden"
               aria-hidden="true"
               ref={overlayRef}
            >
              {isRecording ? (
                 <span className="text-red-400 font-medium tracking-wide flex items-center gap-2">
                   <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                   Recording Audio... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                 </span>
               ) : newMessage ? (
                 <span className="text-white flex items-center gap-x-[1px]">{renderTextWithAppleEmojis(newMessage)}</span>
               ) : (
                 <span className="text-white/50 font-medium tracking-wide">Message your team...</span>
               )}
            </div>
            <input 
              type="text" 
              value={newMessage}
              disabled={isRecording}
              onChange={(e) => handleTyping(e.target.value)}
              onScroll={(e) => { if (overlayRef.current) overlayRef.current.scrollLeft = (e.target as HTMLInputElement).scrollLeft; }}
              className="w-full h-full bg-transparent pl-[60px] pr-[130px] py-4 text-[15px] text-transparent caret-blue-400 placeholder-transparent focus:outline-none relative z-10 font-sans disabled:cursor-not-allowed"
            />
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20">
            <button 
              type="button"
              onClick={toggleRecording}
              className={`p-2 rounded-full transition-all flex items-center justify-center ${isRecording ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-white/50 hover:text-blue-400 hover:bg-white/10'}`}
            >
              <Mic size={20} />
            </button>
            
            <button 
              type="button"
              onClick={() => setShowGifModal(true)}
              className="p-2 text-white/50 hover:text-blue-400 hover:bg-white/10 rounded-full transition-all"
              title="Send GIF"
            >
              <Sticker size={20} />
            </button>

            <button 
              type="button"
              onClick={() => setShowPollModal(true)}
              className="p-2 text-white/50 hover:text-blue-400 hover:bg-white/10 rounded-full transition-all"
              title="Create Poll"
            >
              <BarChart2 size={20} />
            </button>

            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isRecording}
              className="p-2 text-white/50 hover:text-blue-400 hover:bg-white/10 rounded-full transition-all disabled:opacity-50"
            >
              {isUploading ? <Loader2 size={20} className="animate-spin text-blue-400" /> : <Paperclip size={20} />}
            </button>

            <button 
              type="submit"
              disabled={!newMessage.trim() && !isRecording}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-white/30 text-white w-10 h-10 rounded-xl transition-all flex items-center justify-center shadow-lg disabled:shadow-none hover:scale-105 active:scale-95 ml-1"
            >
              {isRecording ? <div className="w-3 h-3 bg-white rounded-sm" /> : <Send size={18} className="-ml-0.5" />}
            </button>
          </div>
        </form>
      </div>
      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center cursor-zoom-out p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-5xl max-h-[90vh]"
            >
              <img src={lightboxImage} alt="Expanded view" className="w-full h-full object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,1)]" />
              <button 
                onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }}
                className="absolute -top-4 -right-4 w-10 h-10 bg-white/10 hover:bg-red-500 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-xl"
              >
                <X size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPollModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1c1c1e] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button onClick={() => setShowPollModal(false)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all">
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <BarChart2 className="text-blue-400" /> Create Poll
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Question</label>
                  <input 
                    type="text" 
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Options</label>
                  <div className="space-y-2">
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...pollOptions];
                            newOpts[i] = e.target.value;
                            setPollOptions(newOpts);
                          }}
                          placeholder={`Option ${i + 1}`}
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
                        />
                        {pollOptions.length > 2 && (
                          <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    + Add Option
                  </button>
                </div>
                
                <button 
                  onClick={async () => {
                    const validOptions = pollOptions.filter(o => o.trim());
                    if (!pollQuestion.trim() || validOptions.length < 2) return alert("Please enter a question and at least 2 options.");
                    
                    const optionsObj = validOptions.map((opt, i) => ({ id: `opt-${i}`, text: opt, votes: [] }));
                    try {
                      await sendMessage({ teamId: team!._id, content: pollQuestion, clerkId: user!.id, isPoll: true, pollOptions: optionsObj });
                      setShowPollModal(false);
                      setPollQuestion('');
                      setPollOptions(['', '']);
                    } catch (e: any) { alert(e.message); }
                  }}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl mt-6 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                >
                  Send Poll
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGifModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1c1c1e] border border-white/10 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative h-[600px] flex flex-col"
            >
              <button onClick={() => setShowGifModal(false)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all">
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Sticker className="text-pink-400" /> Send a GIF
              </h2>

              <form onSubmit={handleSearchGif} className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={gifSearch}
                  onChange={(e) => setGifSearch(e.target.value)}
                  placeholder="Search GIFs..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500/50"
                />
                <button type="submit" disabled={isSearchingGif} className="px-6 py-3 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-500/50 text-white font-bold rounded-xl transition-all">
                  {isSearchingGif ? <Loader2 size={20} className="animate-spin" /> : 'Search'}
                </button>
              </form>

              <div className="flex-1 overflow-y-auto min-h-0 bg-black/20 rounded-xl p-2 border border-white/5">
                {gifResults.length === 0 && !isSearchingGif ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">No GIFs found. Try searching!</div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {gifResults.map((url, i) => (
                      <button 
                        key={i}
                        onClick={async () => {
                          try {
                            const replyId = replyingToMessage?._id;
                            await sendMessage({ teamId: team!._id, content: url, clerkId: user!.id, ...(replyId ? { replyToMessageId: replyId as any } : {}) });
                            setShowGifModal(false);
                            setGifSearch('');
                            setReplyingToMessage(null);
                          } catch(e: any) { alert(e.message); }
                        }}
                        className="w-full h-32 rounded-lg overflow-hidden border border-transparent hover:border-pink-500 transition-all hover:scale-105 hover:shadow-lg focus:outline-none"
                      >
                        <img src={url} alt="GIF" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
