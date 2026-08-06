"use client"

import React from 'react';
import { File, Folder, FileImage, FileText, Download, MoreVertical } from 'lucide-react';

const defaultFiles = [
  { id: '1', name: 'Design Assets', type: 'folder', size: '--', date: 'Today' },
  { id: '2', name: 'Q3 Roadmap.pdf', type: 'pdf', size: '2.4 MB', date: 'Yesterday' },
  { id: '3', name: 'Aurora UI Mockup.png', type: 'image', size: '4.1 MB', date: 'Aug 4' },
  { id: '4', name: 'Meeting Notes.docx', type: 'doc', size: '156 KB', date: 'Aug 2' },
];

export default function FilesPage() {
  const getIcon = (type: string) => {
    switch(type) {
      case 'folder': return <Folder size={24} className="text-indigo-400" fill="currentColor" opacity={0.2} />;
      case 'pdf': return <FileText size={24} className="text-rose-400" />;
      case 'image': return <FileImage size={24} className="text-emerald-400" />;
      default: return <File size={24} className="text-blue-400" />;
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-6 bg-white/[0.01]">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Resource Center</h2>
          <p className="text-gray-400 text-sm">Secure team file storage.</p>
        </div>
        <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10 shadow-sm">
          Upload File
        </button>
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
          {defaultFiles.map((file) => (
            <div key={file.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.02] hover:bg-white/[0.03] transition-colors items-center cursor-pointer group">
              <div className="col-span-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  {getIcon(file.type)}
                </div>
                <span className="font-medium text-gray-200 group-hover:text-white transition-colors">{file.name}</span>
              </div>
              <div className="col-span-3 text-sm text-gray-400">{file.date}</div>
              <div className="col-span-2 text-sm text-gray-400">{file.size}</div>
              <div className="col-span-1 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white"><Download size={16} /></button>
                <button className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white"><MoreVertical size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
