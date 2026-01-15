import React from 'react';
import { Task, TaskStatus } from '../types';
import { Loader2, Microscope, Bug, CheckCircle2, Sparkles } from 'lucide-react';

interface ActiveTaskMonitorProps {
  tasks: Task[];
}

const ActiveTaskMonitor: React.FC<ActiveTaskMonitorProps> = ({ tasks }) => {
  // Find the currently running task, or the most recent failure, or just the first pending
  const activeTask = tasks.find(t => t.status === TaskStatus.RUNNING);
  const lastFailed = tasks.filter(t => t.status === TaskStatus.FAILED).pop();
  
  // If nothing is running, show the last failure (for review) or a standby message
  const displayTask = activeTask || lastFailed;

  if (!displayTask) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
        <Microscope className="w-12 h-12 text-slate-700 mb-4" />
        <h3 className="text-slate-300 font-medium">Ready for Analysis</h3>
        <p className="text-slate-500 text-xs mt-2">Waiting for the agent to pick up a task...</p>
      </div>
    );
  }

  const isRunning = displayTask.status === TaskStatus.RUNNING;
  const isFailed = displayTask.status === TaskStatus.FAILED;

  return (
    <div className={`rounded-xl border p-1 relative overflow-hidden transition-all duration-500 ${
        isRunning ? 'bg-gradient-to-br from-blue-500/20 via-slate-900 to-slate-900 border-blue-500/50 shadow-blue-900/20 shadow-xl' : 
        isFailed ? 'bg-gradient-to-br from-red-500/20 via-slate-900 to-slate-900 border-red-500/50' :
        'bg-slate-900 border-slate-700'
    }`}>
      {/* Animated Background Mesh for Running state */}
      {isRunning && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 animate-pulse"></div>}

      <div className="bg-slate-900/90 rounded-lg p-5 h-full relative z-10 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                {isRunning ? (
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                ) : (
                    <Bug className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-xs font-bold tracking-wider uppercase ${isRunning ? 'text-blue-400' : 'text-red-400'}`}>
                    {isRunning ? 'Agent Working On...' : 'Attention Required'}
                </span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">ID: {displayTask.id}</span>
        </div>

        {/* Task Content */}
        <h2 className="text-lg font-semibold text-slate-100 mb-2 leading-snug">
            {displayTask.description}
        </h2>
        
        <div className="bg-slate-950 rounded border border-slate-800 p-3 mb-4">
            <p className="text-xs text-slate-400 font-mono">
                <span className="text-slate-600 select-none mr-2">$ expected:</span>
                {displayTask.expectedResult}
            </p>
        </div>

        {/* Dynamic Status Section */}
        {isFailed ? (
            <div className="space-y-3 animate-slideDown">
                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg">
                    <h4 className="text-xs font-bold text-red-400 mb-1 flex items-center gap-1">
                        <Bug className="w-3 h-3" /> Failure Analysis
                    </h4>
                    <p className="text-xs text-red-200/80 leading-relaxed">{displayTask.failureReason}</p>
                </div>
                
                {displayTask.fixSuggestion && (
                    <div className="p-3 bg-green-950/20 border border-green-900/30 rounded-lg">
                        <h4 className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Proposed Fix
                        </h4>
                        <pre className="text-[10px] font-mono text-green-200/80 overflow-x-auto p-2 bg-slate-950 rounded border border-green-900/20">
                            {displayTask.fixSuggestion}
                        </pre>
                    </div>
                )}
            </div>
        ) : (
            <div className="flex items-center gap-3 text-slate-500 text-sm mt-4">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span>Simulating scenarios...</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default ActiveTaskMonitor;