
import React from 'react';
import { Task, TaskStatus, CycleHistoryItem } from '../types';
import { CheckCircle, XCircle, Activity, Layers, Bug, PieChart, Clock, Play } from 'lucide-react';

interface DashboardStatsProps {
  tasks: Task[];
  currentCycle: number;
  cycleHistory: CycleHistoryItem[];
  viewingCycle: number | null;
  onSelectCycle: (cycle: number | null) => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ tasks, currentCycle, cycleHistory, viewingCycle, onSelectCycle }) => {
  const total = tasks.length;
  const passed = tasks.filter(t => t.status === TaskStatus.PASSED).length;
  const failed = tasks.filter(t => t.status === TaskStatus.FAILED).length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-xl p-2 px-4 shadow-lg backdrop-blur-md">
      
      {/* Stats Cluster */}
      <div className="flex flex-1 items-center gap-4 overflow-x-auto pb-2 md:pb-0">
          {/* Stat 1: Total Tasks */}
          <div className="flex items-center gap-3 pr-4 border-r border-slate-700/50 min-w-[100px]">
            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
            <Layers className="w-4 h-4" />
            </div>
            <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Tasks</span>
            <span className="text-sm font-bold text-white font-mono leading-none">{total}</span>
            </div>
          </div>

          {/* Stat 2: Success Rate */}
          <div className="flex items-center gap-3 pr-4 border-r border-slate-700/50 min-w-[100px]">
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
          <div className="flex items-center gap-3 pr-4 border-r border-slate-700/50 min-w-[100px]">
            <div className={`p-1.5 rounded-lg ${failed > 0 ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-600'}`}>
            <Bug className="w-4 h-4" />
            </div>
            <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Defects</span>
            <span className={`text-sm font-bold font-mono leading-none ${failed > 0 ? 'text-red-400' : 'text-slate-400'}`}>{failed}</span>
            </div>
          </div>
      </div>

      {/* Cycle Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto min-w-[200px] border-l border-slate-700/50 pl-4">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-2 hidden md:block">Cycle History:</span>
          
          {/* Historical Cycles */}
          {cycleHistory.map((cycle) => (
              <button 
                key={cycle.cycleNumber}
                onClick={() => onSelectCycle(cycle.cycleNumber)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-mono transition-all border ${
                    viewingCycle === cycle.cycleNumber 
                    ? 'bg-slate-700 border-slate-600 text-white shadow-md' 
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                  <Clock className="w-3 h-3" />
                  <span>#{cycle.cycleNumber}</span>
                  {cycle.defectCount > 0 ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-1"></span>
                  ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1"></span>
                  )}
              </button>
          ))}

          {/* Current Cycle (Live) */}
          <button 
            onClick={() => onSelectCycle(null)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-mono transition-all border ${
                viewingCycle === null 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
             {viewingCycle === null ? <Activity className="w-3 h-3 animate-pulse" /> : <Play className="w-3 h-3" />}
             <span>Current (#{currentCycle})</span>
          </button>
      </div>
    </div>
  );
};

export default DashboardStats;
