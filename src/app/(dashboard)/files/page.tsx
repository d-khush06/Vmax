"use client"

import React, { useRef, useState } from 'react';
import { File, Folder, FileImage, FileText, Download, MoreVertical, Loader2, Trash2, Edit2, Check, X } from 'lucide-react';
import { useTeam } from '@/lib/team-context';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

export default function FilesPage() {
  const { team } = useTeam();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const files = useQuery(api.files.list, team ? { teamId: team._id } : "skip");
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  const deleteFile = useMutation(api.files.deleteFile);
  const renameFile = useMutation(api.files.renameFile);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<{ id: string, name: string } | null>(null);
  
  const [filterType, setFilterType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

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
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();

      await saveFile({
        teamId: team._id,
        storageId,
        name: file.name,
        size: file.size,
        type: file.type || 'unknown',
        uploaderId: user.id
      });

      showToast(`Successfully uploaded ${file.name}`);
    } catch (err: any) {
      console.error("Upload error details:", err);
      alert(`Upload Failed: ${err.message || 'Unknown error'}`);
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

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile) return;
    try {
      await renameFile({ fileId: editingFile.id as any, name: editingFile.name });
      showToast("File renamed successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to rename");
    } finally {
      setEditingFile(null);
    }
  };

  const handleDelete = async (fileId: string, storageId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await deleteFile({ fileId: fileId as any, storageId: storageId as any });
      showToast("File deleted successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to delete file");
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-6 relative overflow-hidden" onClick={() => setActiveMenu(null)}>
      {/* Ambient Glass Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#121212]">
        <div className="absolute top-[30%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-teal-500/10 blur-[130px]" />
        <div className="absolute bottom-[20%] right-[30%] w-[40vw] h-[40vw] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-teal-500/20 border border-teal-500/50 text-teal-100 px-4 py-2 rounded-full shadow-[0_10px_30px_rgba(20,184,166,0.3)] flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4 backdrop-blur-md">
          <Check size={16} className="text-teal-400" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      <header className="mb-6 px-5 py-4 flex items-center justify-between relative z-10 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-200 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shadow-inner">
                <Folder size={18} className="text-teal-400" />
              </div>
              Resource Center
            </h2>
            <p className="text-gray-500 text-[13px] mt-1 ml-13 font-medium">Secure team file storage.</p>
          </div>
          
          <div className="hidden md:flex items-center gap-3 ml-4 pl-6 border-l border-white/10 h-10">
            <button 
              onClick={() => setFilterType(filterType === 'all' ? 'image' : filterType === 'image' ? 'pdf' : 'all')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${filterType !== 'all' ? 'bg-teal-500/20 border-teal-500/50 text-teal-400' : 'bg-black/20 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Filter: {filterType === 'all' ? 'All' : filterType === 'image' ? 'Images' : 'PDFs'}
            </button>
            <button 
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${sortOrder === 'asc' ? 'bg-teal-500/20 border-teal-500/50 text-teal-400' : 'bg-black/20 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5h10"/><path d="M11 9h7"/><path d="M11 13h4"/><path d="M3 17l3 3 3-3"/><path d="M6 18V4"/></svg>
              Sort: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            </button>
          </div>
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
            className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] flex items-center gap-2"
          >
            {isUploading && <Loader2 size={16} className="animate-spin" />}
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </header>

      <div className="flex-1 bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative z-10">
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
            (() => {
              let processedFiles = [...files];
              if (filterType !== 'all') {
                processedFiles = processedFiles.filter(f => f.type?.includes(filterType));
              }
              if (sortOrder === 'asc') {
                processedFiles.reverse();
              }
              
              if (processedFiles.length === 0) {
                return <div className="flex justify-center py-10 text-gray-500">No files match your filter.</div>;
              }

              return processedFiles.map((file) => (
                <div key={file._id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.03] transition-colors items-center group">
                <div className="col-span-6 flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 shrink-0 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors shadow-sm">
                    {getIcon(file.type)}
                  </div>
                  {editingFile?.id === file._id ? (
                    <form onSubmit={handleRename} className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="text"
                        autoFocus
                        value={editingFile.name}
                        onChange={(e) => setEditingFile({ ...editingFile, name: e.target.value })}
                        className="bg-black/50 border border-white/20 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500 w-full"
                      />
                      <button type="submit" className="p-1 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/40"><Check size={14}/></button>
                      <button type="button" onClick={() => setEditingFile(null)} className="p-1 bg-white/10 text-gray-400 rounded-md hover:bg-white/20"><X size={14}/></button>
                    </form>
                  ) : (
                    <span className="font-medium text-gray-200 group-hover:text-white transition-colors truncate" title={file.name}>{file.name}</span>
                  )}
                </div>
                <div className="col-span-3 text-sm text-gray-400">{new Date(file._creationTime).toLocaleDateString()}</div>
                <div className="col-span-2 text-sm text-gray-400">{formatSize(file.size)}</div>
                <div className="col-span-1 flex items-center justify-end gap-2 relative">
                  <a href={file.url || '#'} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/20 rounded-md text-gray-400 hover:text-white transition-colors" title="Download">
                    <Download size={16} />
                  </a>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === file._id ? null : file._id); }}
                    className="p-2 bg-white/5 hover:bg-white/20 rounded-md text-gray-400 hover:text-white transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {activeMenu === file._id && (
                    <div className="absolute top-10 right-0 w-36 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl py-1 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                      <button 
                        onClick={() => { setEditingFile({ id: file._id, name: file.name }); setActiveMenu(null); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                      >
                        <Edit2 size={14} /> Rename
                      </button>
                      <button 
                        onClick={() => handleDelete(file._id, file.storageId)}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ));
          })()
        )}
        </div>
      </div>
    </div>
  );
}
