import React, { useEffect, useRef } from 'react';
import { LogEntry, AgentRole } from '../types';
import { Terminal, CheckCircle2, AlertCircle, Info, Bot } from 'lucide-react';

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

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getRoleBadge = (role: AgentRole) => {
    const colors = {
      [AgentRole.ARCHITECT]: 'bg-purple-900 text-purple-200 border-purple-700',
      [AgentRole.QA_LEAD]: 'bg-blue-900 text-blue-200 border-blue-700',
      [AgentRole.TESTER]: 'bg-orange-900 text-orange-200 border-orange-700',
      [AgentRole.FIXER]: 'bg-green-900 text-green-200 border-green-700',
    };
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded border ${colors[role]} font-mono uppercase tracking-wider flex items-center gap-1`}>
        <Bot className="w-3 h-3" /> {role}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden shadow-xl">
      <div className="bg-slate-800 p-3 border-b border-slate-700 flex items-center gap-2">
        <Terminal className="w-5 h-5 text-slate-400" />
        <h2 className="font-semibold text-slate-200 text-sm">Agent Communication Log</h2>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs md:text-sm">
        {logs.length === 0 && (
          <div className="text-slate-500 text-center italic mt-10">Waiting for mission start...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex flex-col gap-1 animate-fadeIn">
            <div className="flex items-center gap-2 text-slate-400 text-[10px]">
              <span>{log.timestamp.toLocaleTimeString()}</span>
              {getRoleBadge(log.role)}
            </div>
            <div className={`p-3 rounded-md bg-slate-800/50 border border-slate-700/50 flex gap-3 ${log.type === 'error' ? 'border-l-red-500 border-l-4' : ''}`}>
              <div className="mt-0.5 shrink-0">{getIcon(log.type)}</div>
              <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">{log.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentLog;
