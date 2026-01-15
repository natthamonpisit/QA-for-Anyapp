
import React from 'react';
import { Task, TaskStatus } from '../types';
import { CheckCircle, XCircle, Activity, Layers, Bug, Zap } from 'lucide-react';

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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
      <div className="glass-panel glass-panel-hover p-4 rounded-xl flex items-center justify-between group transition-all duration-300">
        <div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">ความครอบคลุม</p>
          <div className="flex items-baseline gap-2">
             <h3 className="text-2xl font-bold text-white font-mono">{total}</h3>
             <span className="text-xs text-slate-500">เคสทดสอบ</span>
          </div>
        </div>
        <div className="p-2.5 bg-slate-800 rounded-lg group-hover:bg-blue-500/20 group-hover:text-blue-400 text-slate-500 transition-colors">
          <Layers className="w-5 h-5" />
        </div>
      </div>

      <div className="glass-panel glass-panel-hover p-4 rounded-xl flex items-center justify-between group transition-all duration-300 border-l-4 border-l-green-500/50">
        <div>
          <p className="text-green-500/70 text-[10px] font-bold uppercase tracking-widest mb-1">อัตราสำเร็จ</p>
          <div className="flex items-baseline gap-2">
             <h3 className="text-2xl font-bold text-slate-100 font-mono">{passRate}%</h3>
             <span className="text-xs text-green-500/60 font-medium">({passed})</span>
          </div>
        </div>
        <div className="p-2.5 bg-slate-800 rounded-lg group-hover:bg-green-500/20 group-hover:text-green-400 text-slate-500 transition-colors">
          <CheckCircle className="w-5 h-5" />
        </div>
      </div>

      <div className="glass-panel glass-panel-hover p-4 rounded-xl flex items-center justify-between group transition-all duration-300 border-l-4 border-l-red-500/50">
        <div>
          <p className="text-red-500/70 text-[10px] font-bold uppercase tracking-widest mb-1">ข้อผิดพลาด</p>
          <div className="flex items-baseline gap-2">
             <h3 className="text-2xl font-bold text-slate-100 font-mono">{failed}</h3>
             <span className="text-xs text-slate-500">รายการ</span>
          </div>
        </div>
        <div className="p-2.5 bg-slate-800 rounded-lg group-hover:bg-red-500/20 group-hover:text-red-400 text-slate-500 transition-colors">
          <Bug className="w-5 h-5" />
        </div>
      </div>

      <div className="glass-panel glass-panel-hover p-4 rounded-xl flex items-center justify-between group transition-all duration-300 bg-gradient-to-br from-purple-900/10 to-transparent">
        <div>
          <p className="text-purple-400/70 text-[10px] font-bold uppercase tracking-widest mb-1">รอบการทำงาน</p>
          <div className="flex items-baseline gap-2">
             <h3 className="text-2xl font-bold text-slate-100 font-mono">#{currentCycle}</h3>
             <span className="text-xs text-purple-500 font-medium animate-pulse">Running</span>
          </div>
        </div>
        <div className="p-2.5 bg-slate-800 rounded-lg group-hover:bg-purple-500/20 group-hover:text-purple-400 text-slate-500 transition-colors">
          <Activity className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
