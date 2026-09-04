'use client';

import React, { useState } from 'react';
import { MenuBar } from './MenuBar';
import ManageAccountModal from './ManageAccountModal';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import JoinWorkspaceModal from './JoinWorkspaceModal';
import { AnimatePresence } from 'framer-motion';

export function MenuBarWrapper() {
  const [showManageAccount, setShowManageAccount] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showJoinWorkspace, setShowJoinWorkspace] = useState(false);

  return (
    <>
      <MenuBar 
        onOpenManageAccount={() => setShowManageAccount(true)}
        onOpenCreateWorkspace={() => setShowCreateWorkspace(true)}
        onOpenJoinWorkspace={() => setShowJoinWorkspace(true)}
      />
      
      <AnimatePresence>
        {showManageAccount && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8 pointer-events-auto">
            <ManageAccountModal onClose={() => setShowManageAccount(false)} />
          </div>
        )}
        {showCreateWorkspace && (
          <CreateWorkspaceModal onClose={() => setShowCreateWorkspace(false)} />
        )}
        {showJoinWorkspace && (
          <JoinWorkspaceModal onClose={() => setShowJoinWorkspace(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
