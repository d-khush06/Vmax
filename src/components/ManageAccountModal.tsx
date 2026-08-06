'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { X, Camera, Save, User as UserIcon, Shield, Loader2, Check } from 'lucide-react';

interface ManageAccountModalProps {
  onClose: () => void;
}

export default function ManageAccountModal({ onClose }: ManageAccountModalProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  
  // Form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [username, setUsername] = useState(user?.username || '');
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsUploadingImage(true);
    setError('');
    
    try {
      await user.setProfileImage({ file });
      // Reload user data to reflect new image if needed, though Clerk usually updates the cache instantly
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to upload image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);
    
    try {
      await user.update({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        username: username.trim() || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="relative w-full max-w-4xl h-[600px] overflow-hidden rounded-2xl bg-[#0a0a0c] border border-white/10 shadow-2xl flex"
    >
      {/* Sidebar */}
      <div className="w-64 bg-white/[0.02] border-r border-white/5 flex flex-col p-4">
        <h2 className="text-xl font-bold text-white mb-6 px-2">Account</h2>
        
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
              activeTab === 'profile' ? 'bg-orange-500/10 text-orange-400' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <UserIcon size={16} /> Profile
          </button>
          
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
              activeTab === 'security' ? 'bg-orange-500/10 text-orange-400' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Shield size={16} /> Security
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'profile' && (
            <div className="max-w-xl">
              <h3 className="text-lg font-semibold text-white mb-6 border-b border-white/5 pb-4">Profile Details</h3>
              
              {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                  {error}
                </div>
              )}

              {/* Avatar Upload */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative group">
                  <img 
                    src={user?.imageUrl || `https://i.pravatar.cc/150?u=${user?.id}`} 
                    className="w-20 h-20 rounded-full border border-white/10 object-cover"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100 disabled:bg-black/60"
                  >
                    {isUploadingImage ? <Loader2 size={20} className="text-white animate-spin" /> : <Camera size={20} className="text-white" />}
                  </button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Profile Picture</h4>
                  <p className="text-xs text-gray-500 mt-1">Click the image to upload a new avatar. Max size 2MB.</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Primary Email</label>
                  <input
                    type="text"
                    value={user?.primaryEmailAddress?.emailAddress || ''}
                    disabled
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-600 mt-2">Email addresses are managed via your primary authentication provider.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-end gap-3">
                <AnimatePresence>
                  {saveSuccess && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-green-400 text-sm font-medium flex items-center gap-1.5"
                    >
                      <Check size={14} /> Profile updated
                    </motion.span>
                  )}
                </AnimatePresence>
                
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-400 hover:to-purple-500 text-white text-sm font-semibold transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-xl">
              <h3 className="text-lg font-semibold text-white mb-6 border-b border-white/5 pb-4">Security Settings</h3>
              
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                <Shield size={32} className="text-gray-400 mx-auto mb-3" />
                <h4 className="text-white font-medium mb-2">Authentication Handled Externally</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Your security, passwords, and connected accounts are managed through your primary authentication provider (Google, GitHub, etc.) handled by Clerk. 
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
