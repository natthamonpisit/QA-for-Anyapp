
import React from 'react';
import { Task, TaskStatus } from '../types';
import { CheckCircle, XCircle, Activity, Layers, Bug, PieChart } from 'lucide-react';

interface DashboardStatsProps {
  tasks: Task[];
  currentCycle: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ tasks, currentCycle }) => {
  const total = tasks.length;
  const passed = tasks.filter(t => t.status === TaskStatus.PASSED).length;
  const failed = tasks.filter(t => t.status === TaskStatus.FAILED).length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="flex flex-wrap md:flex-nowrap items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-xl p-2 px-4 shadow-lg backdrop-blur-md">
      {/* Stat 1: Total Tasks */}
      <div className="flex items-center gap-3 pr-4 border-r border-slate-700/50 min-w-[120px]">
        <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
           <Layers className="w-4 h-4" />
        </div>
        <div>
           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Tasks</span>
           <span className="text-sm font-bold text-white font-mono leading-none">{total}</span>
        </div>
      </div>

      {/* Stat 2: Success Rate */}
      <div className="flex items-center gap-3 pr-4 border-r border-slate-700/50 min-w-[120px]">
        <div className="p-1.5 bg-green-500/10 rounded-lg text-green-400">
           <PieChart className="w-4 h-4" />
        </div>
        <div>
           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Success Rate</span>
           <div className="flex items-baseline gap-1.5">
               <span className="text-sm font-bold text-white font-mono leading-none">{passRate}%</span>
               <span className="text-[10px] text-green-500">({passed})</span>
           </div>
        </div>
      </div>

      {/* Stat 3: Defects */}
      <div className="flex items-center gap-3 pr-4 border-r border-slate-700/50 min-w-[120px]">
        <div className={`p-1.5 rounded-lg ${failed > 0 ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-600'}`}>
           <Bug className="w-4 h-4" />
        </div>
        <div>
           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Defects</span>
           <span className={`text-sm font-bold font-mono leading-none ${failed > 0 ? 'text-red-400' : 'text-slate-400'}`}>{failed}</span>
        </div>
      </div>

      {/* Stat 4: Cycle */}
      <div className="flex items-center gap-3 min-w-[120px] ml-auto">
        <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
           <Activity className="w-4 h-4" />
        </div>
        <div>
           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Cycle</span>
           <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono leading-none">#{currentCycle}</span>
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
