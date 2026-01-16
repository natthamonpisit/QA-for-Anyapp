
import React, { useEffect, useState, useRef } from 'react';
import { Task, TaskStatus } from '../types';
import { Loader2, Microscope, Bug, Terminal, Sparkles, Cpu, GitPullRequest, FileCode, PlayCircle, Check, X, Server } from 'lucide-react';
import { useQAWorkflow } from '../hooks/useQAWorkflow';

interface ActiveTaskMonitorProps {
  tasks: Task[];
  githubToken?: string;
  onApplyFix?: (taskId: string) => void;
}

const ActiveTaskMonitor: React.FC<ActiveTaskMonitorProps> = ({ tasks, githubToken, onApplyFix }) => {
  const activeTask = tasks.find(t => t.status === TaskStatus.RUNNING);
  const lastFailed = tasks.filter(t => t.status === TaskStatus.FAILED).pop();
  const lastPassed = tasks.filter(t => t.status === TaskStatus.PASSED).pop();
  const firstPending = tasks.find(t => t.status === TaskStatus.PENDING);
  
  // Prioritize active, then failures, then passes, then pending (for resume state)
  const displayTask = activeTask || lastFailed || lastPassed || firstPending;

  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!displayTask) {
        setConsoleOutput([]);
        return;
    }

    if (displayTask.status === TaskStatus.RUNNING) {
        const mockBootLogs = [
            `> Initializing Virtual Runtime (AI-Core v2.5)...`,
            `> Loading context from ${displayTask.relatedFiles?.length || 0} source files...`,
            `> Mounting virtual DOM...`,
            `> Injecting mock providers...`,
            `> Executing test scenario: ${displayTask.id}...`
        ];
        let i = 0;
        const interval = setInterval(() => {
            if (i < mockBootLogs.length) {
                // Defensive Check: Ensure log exists
                const nextLog = mockBootLogs[i];
                if (nextLog) {
                    setConsoleOutput(prev => [...prev, nextLog]);
                }
                i++;
            }
        }, 800);
        return () => clearInterval(interval);
    } 
    else if ((displayTask.status === TaskStatus.PASSED || displayTask.status === TaskStatus.FAILED) && displayTask.executionLogs) {
        // Defensive Check: Filter out undefined logs immediately
        const safeLogs = displayTask.executionLogs.filter(l => typeof l === 'string');
        setConsoleOutput(safeLogs.map(l => `> ${l}`));
    } 
    else if (displayTask.status === TaskStatus.PENDING) {
        setConsoleOutput([`> Status: READY`, `> Waiting for execution trigger...`]);
    }
  }, [displayTask]);

  useEffect(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [consoleOutput]);


  if (!displayTask) {
    return (
         <div className="h-full w-full bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
             <div className="p-3 bg-slate-900 rounded-full mb-3 border border-slate-800">
                <Cpu className="w-6 h-6 text-slate-700" />
             </div>
             <p className="text-slate-600 text-xs font-mono">System Idle</p>
         </div>
    );
  }

  const isRunning = displayTask.status === TaskStatus.RUNNING;
  const isFailed = displayTask.status === TaskStatus.FAILED;
  const isPassed = displayTask.status === TaskStatus.PASSED;
  const isPending = displayTask.status === TaskStatus.PENDING;

  return (
    <div className={`h-full flex flex-col relative overflow-hidden bg-[#050505]`}>
      
        {/* Simplified Status Bar */}
        <div className={`px-3 py-1.5 border-b flex items-center justify-between ${
            isRunning ? 'border-blue-900/30 bg-blue-950/10' : 
            isFailed ? 'border-red-900/30 bg-red-950/10' : 
            isPassed ? 'border-green-900/30 bg-green-950/10' :
            'border-slate-800 bg-slate-900/20'
        }`}>
            <div className="flex items-center gap-2">
                {isRunning && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
                {isFailed && <Bug className="w-3 h-3 text-red-500" />}
                {isPassed && <Check className="w-3 h-3 text-green-500" />}
                {isPending && <PlayCircle className="w-3 h-3 text-slate-500" />}
                
                <span className={`text-[9px] font-bold tracking-widest uppercase font-mono ${
                    isRunning ? 'text-blue-400' : isFailed ? 'text-red-400' : isPassed ? 'text-green-400' : 'text-slate-500'
                }`}>
                    {isRunning ? 'EXECUTING' : isFailed ? 'FAILED' : isPassed ? 'PASSED' : 'READY'}
                </span>
            </div>
            <span className="font-mono text-[9px] text-slate-600">{displayTask.id}</span>
        </div>

        {/* Console Area */}
        <div className="p-3 flex-1 flex flex-col min-h-0">
             <div className="mb-2">
                 <h2 className="text-xs text-slate-300 font-medium leading-tight line-clamp-2">
                    {displayTask.description}
                </h2>
             </div>
            
             <div className="flex-1 bg-black/50 rounded border border-slate-800 p-2 font-mono text-[10px] relative overflow-hidden flex flex-col shadow-inner">
                 <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                     {consoleOutput.map((logItem, idx) => {
                         // CRITICAL FIX: Ensure logItem is a string before checking includes
                         const log = logItem || ''; 
                         
                         return (
                             <div key={idx} className="flex gap-2 animate-fadeIn">
                                 <span className="text-slate-700 select-none">$</span>
                                 <span className={`${
                                     log.includes('Error') || log.includes('Failed') ? 'text-red-400' : 
                                     log.includes('Success') || log.includes('Passed') ? 'text-green-400' : 
                                     'text-slate-400'
                                 }`}>
                                     {log.replace('> ', '')}
                                 </span>
                             </div>
                         );
                     })}
                     {isRunning && <div className="animate-pulse text-blue-500">_</div>}
                 </div>
            </div>

            {/* Compact Failure Action */}
            {isFailed && (
                <div className="mt-2 flex gap-2 animate-slideUp">
                    <div className="bg-red-950/20 border border-red-900/20 rounded px-2 py-1.5 flex-1 min-w-0">
                        <p className="text-[10px] text-red-300 truncate" title={displayTask.failureReason}>
                            <span className="font-bold text-red-500 mr-1">Error:</span>
                            {displayTask.failureReason}
                        </p>
                    </div>
                    {displayTask.fixSuggestion && onApplyFix && !displayTask.prUrl && (
                        <button 
                            onClick={() => onApplyFix(displayTask.id)}
                            disabled={!githubToken}
                            className="bg-green-600 hover:bg-green-500 text-white text-[10px] px-2 rounded whitespace-nowrap"
                        >
                           {githubToken ? 'Auto Fix' : 'Connect GH'}
                        </button>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default ActiveTaskMonitor;
