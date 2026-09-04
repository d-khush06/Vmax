'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTeam } from '@/lib/team-context';
import { useUser } from '@clerk/nextjs';
import { X, Lock, CheckCircle2 } from 'lucide-react';
import { useThemeStore } from '@/lib/theme-store';

export function TradeWindow() {
  const { team, teammates } = useTeam();
  const { user } = useUser();
  const { theme } = useThemeStore();
  
  const trade = useQuery(api.trades.getActiveTrade, (team && user) ? { teamId: team._id, clerkId: user.id } : "skip");
  
  const updateItems = useMutation(api.trades.updateTradeItems);
  const toggleAccept = useMutation(api.trades.toggleAccept);
  const cancelTrade = useMutation(api.trades.cancelTrade);

  const [localItem, setLocalItem] = useState('');

  if (!trade || !user) return null;

  const isInitiator = trade.initiatorId === user.id;
  const myItems = isInitiator ? trade.initiatorItems : trade.receiverItems;
  const theirItems = isInitiator ? trade.receiverItems : trade.initiatorItems;
  
  const myAccept = isInitiator ? trade.initiatorAccepted : trade.receiverAccepted;
  const theirAccept = isInitiator ? trade.receiverAccepted : trade.initiatorAccepted;

  const otherUserId = isInitiator ? trade.receiverId : trade.initiatorId;
  const otherUser = teammates.find(t => t.id === otherUserId);

  const handleAddItem = async () => {
    if (!localItem.trim()) return;
    const newItems = [...myItems, { id: Date.now().toString(), name: localItem }];
    await updateItems({ tradeId: trade._id, clerkId: user.id, items: newItems });
    setLocalItem('');
  };

  const handleAccept = async () => {
    await toggleAccept({ tradeId: trade._id, clerkId: user.id, accepted: !myAccept });
  };

  const handleCancel = async () => {
    await cancelTrade({ tradeId: trade._id });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[600px] h-[400px] flex flex-col bg-[var(--coal)] bevel shadow-2xl font-sans text-[var(--quartz)]">
        
        <div className="flex justify-between items-center p-3 border-b-2 border-[var(--slate)] bg-[var(--slate-raised)]">
          <h2 className="font-display uppercase text-[var(--ore)] tracking-wide">
            Trade with {otherUser?.full_name || 'Unknown'}
          </h2>
          <button onClick={handleCancel} className="text-[var(--quartz-dim)] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 flex">
          {/* My Side */}
          <div className={`flex-1 flex flex-col border-r-2 border-[var(--slate)] transition-colors duration-300 ${myAccept ? 'bg-[var(--moss)]/10' : ''}`}>
            <div className="p-2 border-b-2 border-[var(--slate)] text-center text-xs font-bold text-[var(--quartz-dim)]">
              YOU {myAccept && <span className="text-[var(--moss)] ml-2">(READY)</span>}
            </div>
            <div className="flex-1 p-4 space-y-2 overflow-y-auto hide-scrollbar">
              {myItems.map((item: any) => (
                <div key={item.id} className="p-2 bg-[var(--slate)] bevel-inset text-[var(--quartz)] text-sm">
                  {item.name}
                </div>
              ))}
            </div>
            {!myAccept && (
               <div className="p-2 flex gap-2 border-t-2 border-[var(--slate)] bg-[var(--coal)]">
                 <input 
                   type="text" 
                   value={localItem}
                   onChange={e => setLocalItem(e.target.value)}
                   placeholder="Item name..."
                   className="flex-1 bg-[var(--slate)] bevel-inset px-2 py-1 text-sm outline-none text-[var(--quartz)] focus:ring-2 focus:ring-[var(--ore)]"
                   onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                 />
                 <button onClick={handleAddItem} className="bg-[var(--ore)] hover:bg-[var(--ore-text)] text-black px-3 py-1 text-sm font-bold bevel transition-colors">
                   +
                 </button>
               </div>
            )}
            <div className="p-3 border-t-2 border-[var(--slate)] bg-[var(--coal)]">
              <button 
                onClick={handleAccept}
                className={`w-full py-2 flex items-center justify-center gap-2 font-bold transition-all bevel text-sm ${
                  myAccept 
                    ? 'bg-[var(--ore)] hover:bg-[var(--ore-text)] text-black' 
                    : 'bg-[var(--moss)] hover:bg-[#7bc06a] text-black'
                }`}
              >
                {myAccept ? 'CANCEL ACCEPT' : 'ACCEPT TRADE'}
              </button>
            </div>
          </div>

          {/* Their Side */}
          <div className={`flex-1 flex flex-col transition-colors duration-300 ${theirAccept ? 'bg-[var(--moss)]/10' : ''}`}>
            <div className="p-2 border-b-2 border-[var(--slate)] text-center text-xs font-bold text-[var(--quartz-dim)] uppercase">
              {otherUser?.full_name || 'THEM'} {theirAccept && <span className="text-[var(--moss)] ml-2">(READY)</span>}
            </div>
            <div className="flex-1 p-4 space-y-2 overflow-y-auto hide-scrollbar">
              {theirItems.length === 0 && (
                <div className="text-center text-[var(--quartz-dim)] text-xs mt-10 font-mono">No items offered</div>
              )}
              {theirItems.map((item: any) => (
                <div key={item.id} className="p-2 bg-[var(--slate)] bevel-inset text-[var(--quartz)] text-sm">
                  {item.name}
                </div>
              ))}
            </div>
            <div className="p-3 border-t-2 border-[var(--slate)] flex items-center justify-center h-[73px] bg-[var(--coal)]">
               {theirAccept ? (
                 <div className="text-[var(--moss)] flex items-center gap-2 font-bold"><CheckCircle2 size={18} /> READY</div>
               ) : (
                 <div className="text-[var(--quartz-dim)] flex items-center gap-2 text-sm font-bold"><Lock size={14} /> DECIDING...</div>
               )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
