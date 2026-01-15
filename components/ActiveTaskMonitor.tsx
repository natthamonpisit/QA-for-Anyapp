
import React from 'react';
import { Task, TaskStatus } from '../types';
import { Loader2, Microscope, Bug, Terminal, Sparkles, Cpu } from 'lucide-react';

interface ActiveTaskMonitorProps {
  tasks: Task[];
}

const ActiveTaskMonitor: React.FC<ActiveTaskMonitorProps> = ({ tasks }) => {
  const activeTask = tasks.find(t => t.status === TaskStatus.RUNNING);
  const lastFailed = tasks.filter(t => t.status === TaskStatus.FAILED).pop();
  const displayTask = activeTask || lastFailed;

  if (!displayTask) {
    return (
      <div className="h-full glass-panel rounded-xl p-1 flex flex-col">
         <div className="bg-slate-900/50 rounded-lg h-full flex flex-col items-center justify-center border border-slate-800 relative overflow-hidden">
             <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
             <div className="p-4 bg-slate-800/50 rounded-full mb-4 border border-slate-700 shadow-xl shadow-black/50">
                <Cpu className="w-8 h-8 text-slate-600" />
             </div>
             <h3 className="text-slate-400 font-medium text-sm tracking-wider uppercase">System Idle</h3>
             <p className="text-slate-600 text-xs mt-1 font-mono">Waiting for command execution protocol...</p>
         </div>
      </div>
    );
  }

  const isRunning = displayTask.status === TaskStatus.RUNNING;
  const isFailed = displayTask.status === TaskStatus.FAILED;

  return (
    <div className={`h-full rounded-xl p-[1px] relative overflow-hidden transition-all duration-500 ${
        isRunning 
        ? 'bg-gradient-to-b from-blue-500 via-cyan-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
        : isFailed 
        ? 'bg-gradient-to-b from-red-500 via-orange-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.2)]'
        : 'bg-slate-800'
    }`}>
      <div className="bg-slate-950 h-full rounded-[11px] flex flex-col relative z-10">
        
        {/* Header Bar */}
        <div className={`px-4 py-2 border-b flex items-center justify-between ${isRunning ? 'border-blue-900/50 bg-blue-950/10' : 'border-red-900/50 bg-red-950/10'}`}>
            <div className="flex items-center gap-2">
                {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> : <Bug className="w-3.5 h-3.5 text-red-500" />}
                <span className={`text-[10px] font-bold tracking-widest uppercase font-mono ${isRunning ? 'text-blue-400' : 'text-red-400'}`}>
                    {isRunning ? 'EXECUTING_TEST_PROTOCOL' : 'FAILURE_DETECTED'}
                </span>
            </div>
            <span className="font-mono text-[10px] text-slate-600">{displayTask.id}</span>
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 flex flex-col justify-center relative">
            {isRunning && <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/50 blur-sm animate-scan opacity-50 pointer-events-none"></div>}
            
            <h2 className="text-lg md:text-xl font-medium text-slate-200 mb-4 leading-relaxed font-sans">
                {displayTask.description}
            </h2>

            {/* Terminal Output Look */}
            <div className="bg-[#0c0c0c] rounded border border-slate-800 p-3 font-mono text-xs relative overflow-hidden group">
                 <div className="absolute top-2 right-2 flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                 </div>
                 <p className="text-slate-500 mb-1 flex items-center gap-2">
                    <span className="text-blue-500">➜</span> 
                    <span className="opacity-70">assert</span>
                    <span className="text-yellow-500/80">expectation</span>
                 </p>
                 <p className="text-slate-300 pl-4 border-l-2 border-slate-800">{displayTask.expectedResult}</p>
            </div>

            {/* Failure Analysis (Animated) */}
            {isFailed && (
                <div className="mt-4 space-y-3 animate-fadeIn">
                    <div className="flex gap-3">
                         <div className="w-0.5 bg-red-800/50"></div>
                         <div className="flex-1">
                            <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Root Cause Analysis</h4>
                            <p className="text-xs text-red-200/70">{displayTask.failureReason}</p>
                         </div>
                    </div>
                    {displayTask.fixSuggestion && (
                         <div className="flex gap-3">
                             <div className="w-0.5 bg-green-800/50"></div>
                             <div className="flex-1">
                                <h4 className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Auto-Fix Proposal</h4>
                                <div className="bg-green-950/10 p-2 rounded border border-green-500/10">
                                    <pre className="text-[10px] font-mono text-green-400 overflow-x-auto whitespace-pre-wrap">{displayTask.fixSuggestion.substring(0, 150)}...</pre>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ActiveTaskMonitor;
