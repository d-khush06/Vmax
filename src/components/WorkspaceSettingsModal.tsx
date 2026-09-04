'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { X, Upload, Copy, Check, Trash2, LogOut, Settings } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: any;
}

export default function WorkspaceSettingsModal({ isOpen, onClose, team }: WorkspaceSettingsModalProps) {
  const { user } = useUser();
  const router = useRouter();
  
  const updateTeam = useMutation(api.teams.updateTeam);
  const deleteTeam = useMutation(api.teams.deleteTeam);
  const leaveTeam = useMutation(api.teams.leaveTeam);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  
  const [name, setName] = useState(team?.name || '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setMounted(true);
    if (team?.name) setName(team.name);
  }, [team?.name]);

  if (!isOpen || !team) return null;

  const isOwner = team.createdBy === user?.id;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(team.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveName = async () => {
    if (!name.trim() || name === team.name || !user) return;
    setLoading(true);
    try {
      await updateTeam({ teamId: team._id, clerkId: user.id, name });
    } catch (e) {
      console.error(e);
      alert('Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setLoading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      const { storageId } = await result.json();
      await updateTeam({ teamId: team._id, clerkId: user.id, imageStorageId: storageId });
    } catch (e) {
      console.error(e);
      alert('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (confirm("Are you sure you want to leave this workspace?")) {
      await leaveTeam({ teamId: team._id, clerkId: user?.id as string });
      window.location.href = "/";
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you absolutely sure you want to delete this workspace? This cannot be undone.")) {
      await deleteTeam({ teamId: team._id, clerkId: user?.id as string });
      window.location.href = "/";
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#1c1c1e] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Settings size={18} className="text-blue-400" />
              Workspace Settings
            </h2>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-8">
            
            {/* Image & Name Section */}
            <div className="flex gap-4 items-center">
              <div 
                className="w-20 h-20 rounded-xl bg-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/15 transition-colors border border-white/10 relative overflow-hidden group"
                onClick={() => isOwner && fileInputRef.current?.click()}
              >
                {team.imageUrl ? (
                  <>
                    <img src={team.imageUrl} alt="Workspace" className="w-full h-full object-cover" />
                    {isOwner && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload size={20} className="text-white" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-white/50">
                    <span className="text-2xl font-bold block">{team.name.charAt(0).toUpperCase()}</span>
                    {isOwner && <span className="text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest block">Upload</span>}
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={!isOwner || loading}
                />
              </div>

              <div className="flex-1">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">Workspace Name</label>
                <div className="flex gap-2">
                  <input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isOwner || loading}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors"
                  />
                  {isOwner && name !== team.name && (
                    <button 
                      onClick={handleSaveName}
                      disabled={loading}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                    >
                      Save
                    </button>
                  )}
                </div>
                {!isOwner && <div className="text-[10px] text-white/30 mt-1">Only the owner can rename the workspace.</div>}
              </div>
            </div>

            {/* Join Code */}
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">Join Code</label>
              <div className="flex gap-2 items-center">
                <code className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white/80 font-mono tracking-widest text-center text-lg">
                  {team.joinCode}
                </code>
                <button 
                  onClick={handleCopyCode}
                  className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 transition-colors"
                >
                  {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div className="h-px bg-white/10" />

            {/* Danger Zone */}
            <div>
              <label className="text-xs font-bold text-red-400/80 uppercase tracking-widest mb-2 block">Danger Zone</label>
              
              {!isOwner ? (
                <button 
                  onClick={handleLeave}
                  className="w-full flex items-center justify-between px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 transition-colors group"
                >
                  <span className="font-semibold">Leave Workspace</span>
                  <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button 
                  onClick={handleDelete}
                  className="w-full flex items-center justify-between px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 transition-colors group"
                >
                  <span className="font-semibold">Delete Workspace</span>
                  <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
