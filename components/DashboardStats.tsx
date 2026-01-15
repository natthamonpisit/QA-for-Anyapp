import React from 'react';
import { Task, TaskStatus } from '../types';
import { CheckCircle2, XCircle, Activity, Layers } from 'lucide-react';

interface DashboardStatsProps {
  tasks: Task[];
  currentCycle: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ tasks, currentCycle }) => {
  const total = tasks.length;
  const passed = tasks.filter(t => t.status === TaskStatus.PASSED).length;
  const failed = tasks.filter(t => t.status === TaskStatus.FAILED).length;
  const pending = tasks.filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.RUNNING).length;
  
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4 shadow-lg backdrop-blur-sm">
        <div className="p-3 bg-blue-500/10 rounded-lg">
          <Layers className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Tasks</p>
          <h3 className="text-2xl font-bold text-slate-100">{total} <span className="text-sm text-slate-500 font-normal">tests</span></h3>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4 shadow-lg backdrop-blur-sm">
        <div className="p-3 bg-green-500/10 rounded-lg">
          <CheckCircle2 className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Passed</p>
          <h3 className="text-2xl font-bold text-slate-100">{passed} <span className="text-sm text-green-500/70 font-mono">({passRate}%)</span></h3>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4 shadow-lg backdrop-blur-sm">
        <div className="p-3 bg-red-500/10 rounded-lg">
          <XCircle className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Failed / Bugs</p>
          <h3 className="text-2xl font-bold text-slate-100">{failed} <span className="text-sm text-slate-500 font-normal">issues</span></h3>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4 shadow-lg backdrop-blur-sm">
        <div className="p-3 bg-purple-500/10 rounded-lg">
          <Activity className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Current Cycle</p>
          <h3 className="text-2xl font-bold text-slate-100">#{currentCycle} <span className="text-sm text-purple-400 font-normal animate-pulse">Active</span></h3>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;