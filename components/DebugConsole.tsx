
import React, { useEffect, useRef, useState } from 'react';
import { X, Trash2, Copy, Terminal, Activity, Database, AlertTriangle, Bug } from 'lucide-react';
import { LogEntry, AppState } from '../types';

interface DebugConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  state: AppState;
  onClearLogs: () => void;
}

const DebugConsole: React.FC<DebugConsoleProps> = ({ isOpen, onClose, logs, state, onClearLogs }) => {
  const [activeTab, setActiveTab] = useState<'LOGS' | 'STATE'>('LOGS');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (activeTab === 'LOGS' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, activeTab, isOpen]);

  if (!isOpen) return null;

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.timestamp.toISOString()}] [${l.source || l.role}] ${l.type.toUpperCase()}: ${l.message} ${l.details ? JSON.stringify(l.details) : ''}`).join('\n');
    navigator.clipboard.writeText(text);
    alert('Logs copied to clipboard');
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-[#0c0c0c] border-l border-slate-800 shadow-2xl z-50 flex flex-col font-mono text-xs animate-slideLeft">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#111]">
        <div className="flex items-center gap-2 text-green-500 font-bold">
          <Terminal className="w-4 h-4" />
          <span>SYSTEM_DEBUG_CONSOLE_v1.0</span>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={onClearLogs} className="p-1.5 hover:bg-red-900/30 text-slate-500 hover:text-red-400 rounded transition-colors" title="Clear Logs">
             <Trash2 className="w-4 h-4" />
           </button>
           <button onClick={onClose} className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-white rounded transition-colors">
             <X className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-[#0a0a0a]">
         <button 
            onClick={() => setActiveTab('LOGS')}
            className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'LOGS' ? 'border-green-500 text-green-400 bg-green-900/10' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
         >
            <Activity className="w-3 h-3" /> Live Logs ({logs.length})
         </button>
         <button 
            onClick={() => setActiveTab('STATE')}
            className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'STATE' ? 'border-blue-500 text-blue-400 bg-blue-900/10' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
         >
            <Database className="w-3 h-3" /> State Inspector
         </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-black/90">
         
         {/* LOGS TAB */}
         {activeTab === 'LOGS' && (
             <div className="absolute inset-0 flex flex-col">
                 <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                     {logs.length === 0 && <div className="text-slate-700 text-center mt-10">No logs recorded yet.</div>}
                     {logs.map((log) => (
                         <div key={log.id} className="flex gap-2 group border-b border-white/5 pb-2 last:border-0">
                             <div className="shrink-0 text-slate-600 w-20 pt-0.5">
                                 {log.timestamp.toLocaleTimeString([], { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' })}:.{log.timestamp.getMilliseconds().toString().padStart(3, '0')}
                             </div>
                             <div className="flex-1 min-w-0 break-words">
                                 <div className="flex items-center gap-2 mb-0.5">
                                     <span className={`font-bold px-1.5 rounded-sm text-[10px] ${
                                         log.type === 'error' ? 'bg-red-900/50 text-red-400' : 
                                         log.type === 'warning' ? 'bg-yellow-900/50 text-yellow-400' : 
                                         log.type === 'success' ? 'bg-green-900/50 text-green-400' : 
                                         'bg-slate-800 text-slate-400'
                                     }`}>
                                         {log.type.toUpperCase()}
                                     </span>
                                     <span className="text-purple-400 font-semibold">[{log.source || log.role}]</span>
                                 </div>
                                 <div className={`text-sm ${log.type === 'error' ? 'text-red-300' : 'text-slate-300'}`}>
                                     {log.message}
                                 </div>
                                 {log.details && (
                                     <div className="mt-2 bg-slate-900/50 p-2 rounded border border-slate-800 text-slate-400 overflow-x-auto">
                                         <pre className="text-[10px]">{typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : String(log.details)}</pre>
                                     </div>
                                 )}
                             </div>
                         </div>
                     ))}
                 </div>
                 <div className="p-2 border-t border-slate-800 bg-[#111] flex justify-end">
                     <button onClick={handleCopyLogs} className="flex items-center gap-2 text-slate-400 hover:text-white text-xs px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700">
                         <Copy className="w-3 h-3" /> Copy Output
                     </button>
                 </div>
             </div>
         )}

         {/* STATE TAB */}
         {activeTab === 'STATE' && (
             <div className="absolute inset-0 overflow-y-auto p-4 custom-scrollbar">
                 <div className="space-y-4">
                     {/* Workflow Section */}
                     <div className="bg-slate-900/30 border border-slate-800 rounded p-3">
                         <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2"><Activity className="w-3 h-3"/> WORKFLOW</h3>
                         <div className="grid grid-cols-2 gap-2 text-slate-300">
                             <div>Step: <span className="text-white">{state.workflowStep}</span></div>
                             <div>Cycle: <span className="text-white">{state.currentCycle}/{state.maxCycles}</span></div>
                             <div>View: <span className="text-white">{state.currentView}</span></div>
                             <div>Processing: <span className={state.isProcessing ? "text-green-400" : "text-slate-500"}>{String(state.isProcessing)}</span></div>
                         </div>
                     </div>

                     {/* Repository Section */}
                     <div className="bg-slate-900/30 border border-slate-800 rounded p-3">
                         <h3 className="text-yellow-400 font-bold mb-2">REPOSITORY</h3>
                         <div className="text-slate-300 truncate">Name: <span className="text-white">{state.currentRepoName || 'N/A'}</span></div>
                         <div className="text-slate-300">Context Length: <span className="text-white">{state.codeContext.length.toLocaleString()} chars</span></div>
                         <div className="mt-2">
                             <div className="text-slate-500 mb-1">Function Summary:</div>
                             <div className="h-20 overflow-y-auto bg-black p-2 rounded border border-slate-800 text-slate-400 text-[10px]">
                                 {state.functionSummary || 'N/A'}
                             </div>
                         </div>
                     </div>

                     {/* Tasks Section */}
                     <div className="bg-slate-900/30 border border-slate-800 rounded p-3">
                         <h3 className="text-green-400 font-bold mb-2 flex items-center justify-between">
                            <span>TASKS ({state.tasks.length})</span>
                            <span className="text-[10px] text-slate-500">Raw Data</span>
                         </h3>
                         <div className="h-64 overflow-y-auto bg-black p-2 rounded border border-slate-800">
                             <pre className="text-[10px] text-green-300/80">
                                 {JSON.stringify(state.tasks, null, 2)}
                             </pre>
                         </div>
                     </div>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default DebugConsole;
