"use client"

import React, { useRef, useState } from 'react';
import { File, Folder, FileImage, FileText, Download, MoreVertical, Loader2 } from 'lucide-react';
import { useTeam } from '@/lib/team-context';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

export default function FilesPage() {
  const { team } = useTeam();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const files = useQuery(api.files.listFiles, team ? { teamId: team._id } : "skip");
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !team || !user) return;

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();

      await saveFile({
        teamId: team._id,
        storageId,
        name: file.name,
        size: file.size,
        type: file.type,
        clerkId: user.id
      });
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('image')) return <FileImage size={24} className="text-emerald-400" />;
    if (type.includes('pdf')) return <FileText size={24} className="text-rose-400" />;
    return <File size={24} className="text-blue-400" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="h-full w-full flex flex-col p-6 bg-white/[0.01]">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Resource Center</h2>
          <p className="text-gray-400 text-sm">Secure team file storage.</p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <button 
            onClick={handleUploadClick}
            disabled={isUploading}
            className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10 shadow-sm flex items-center gap-2"
          >
            {isUploading && <Loader2 size={16} className="animate-spin" />}
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </header>

      <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-md overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-6">Name</div>
          <div className="col-span-3">Date Modified</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-1"></div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto">
          {files === undefined ? (
            <div className="flex justify-center py-10 text-gray-500"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : files.length === 0 ? (
            <div className="flex justify-center py-10 text-gray-500">No files uploaded yet.</div>
          ) : (
            files.map((file) => (
              <div key={file._id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.02] hover:bg-white/[0.03] transition-colors items-center group">
                <div className="col-span-6 flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    {getIcon(file.type)}
                  </div>
                  <span className="font-medium text-gray-200 group-hover:text-white transition-colors truncate" title={file.name}>{file.name}</span>
                </div>
                <div className="col-span-3 text-sm text-gray-400">{new Date(file.created_at).toLocaleDateString()}</div>
                <div className="col-span-2 text-sm text-gray-400">{formatSize(file.size)}</div>
                <div className="col-span-1 flex items-center justify-end gap-2">
                  <a href={file.url || '#'} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/20 rounded-md text-gray-400 hover:text-white transition-colors" title="Download">
                    <Download size={16} />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
