
import React, { useEffect, useRef } from 'react';
import { LogEntry, AgentRole } from '../types';
import { Terminal, Bot, ChevronRight } from 'lucide-react';

interface AgentLogProps {
  logs: LogEntry[];
}

const AgentLog: React.FC<AgentLogProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getRoleColor = (role: AgentRole) => {
    switch (role) {
      case AgentRole.ARCHITECT: return 'text-purple-400';
      case AgentRole.QA_LEAD: return 'text-blue-400';
      case AgentRole.TESTER: return 'text-orange-400';
      case AgentRole.FIXER: return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-xl overflow-hidden shadow-2xl">
      <div className="bg-[#050505] p-2 border-b border-slate-800 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
           <Terminal className="w-3.5 h-3.5 text-slate-500" />
           <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">System_Log</span>
        </div>
        <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-800"></div>
            <div className="w-2 h-2 rounded-full bg-slate-800"></div>
            <div className="w-2 h-2 rounded-full bg-slate-800"></div>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-[#0a0a0a] font-mono text-xs space-y-3 scanline relative">
        {logs.length === 0 && (
          <div className="text-slate-700 text-center italic mt-10">Waiting for data stream...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 animate-fadeIn hover:bg-slate-900/30 p-1 rounded -mx-1 transition-colors">
            <div className="text-[10px] text-slate-600 shrink-0 w-16 pt-0.5">
                {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className={`font-bold tracking-tight ${getRoleColor(log.role)} flex items-center gap-1`}>
                        <Bot className="w-3 h-3" />
                        {log.role}
                    </span>
                    <ChevronRight className="w-3 h-3 text-slate-700" />
                </div>
                <div className={`leading-relaxed whitespace-pre-wrap ${log.type === 'error' ? 'text-red-400 bg-red-950/10 p-2 rounded border-l-2 border-red-500' : 'text-slate-300'}`}>
                    {log.message}
                </div>
            </div>
          </div>
        ))}
        {/* Anchor for auto-scroll */}
        <div className="h-4"></div>
      </div>
    </div>
  );
};

export default AgentLog;
