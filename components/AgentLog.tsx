
import React, { useEffect, useRef } from 'react';
import { LogEntry, AgentRole } from '../types';
import { Terminal, Bot, ChevronRight, UploadCloud } from 'lucide-react';

interface AgentLogProps {
  logs: LogEntry[];
  onUpload?: () => void;
}

const AgentLog: React.FC<AgentLogProps> = ({ logs, onUpload }) => {
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 bg-[#050505] font-mono text-[10px] space-y-2 relative h-full custom-scrollbar">
        {logs.length === 0 && (
          <div className="text-slate-700 text-center italic mt-4">System ready. Waiting for events...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 animate-fadeIn hover:bg-slate-900/30 p-1 rounded -mx-1 transition-colors">
            <div className="text-slate-600 shrink-0 opacity-50">
                {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
            </div>
            <div className="flex-1 min-w-0">
                <span className={`font-bold mr-2 ${getRoleColor(log.role)}`}>
                    {log.role}
                </span>
                <span className={`${log.type === 'error' ? 'text-red-400' : 'text-slate-400'}`}>
                    {log.message}
                </span>
            </div>
          </div>
        ))}
      </div>
  );
};

export default AgentLog;
