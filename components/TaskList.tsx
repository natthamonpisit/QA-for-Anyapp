
import React from 'react';
import { Task, TaskStatus } from '../types';
import { CheckCircle, XCircle, CircleDashed, Loader2, ListTodo, AlertTriangle } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2 h-full bg-[#050505] custom-scrollbar">
        {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 text-xs gap-2 min-h-[100px]">
                <CircleDashed className="w-6 h-6 opacity-20" />
                <span>Waiting for Test Plan...</span>
            </div>
        )}

        {tasks.map((task) => {
           let statusColor = "border-slate-800 bg-slate-900/30 text-slate-400 hover:bg-slate-800";
           let icon = <CircleDashed className="w-3.5 h-3.5 text-slate-600" />;
           
           if (task.status === TaskStatus.RUNNING) {
               statusColor = "border-blue-500/30 bg-blue-900/10 text-slate-200 shadow-[inset_3px_0_0_0_#3b82f6]";
               icon = <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
           } else if (task.status === TaskStatus.PASSED) {
               statusColor = "border-green-900/30 bg-green-900/5 opacity-60 hover:opacity-100 text-slate-500";
               icon = <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
           } else if (task.status === TaskStatus.FAILED) {
               statusColor = "border-red-900/30 bg-red-900/10 text-slate-200 shadow-[inset_3px_0_0_0_#ef4444]";
               icon = <XCircle className="w-3.5 h-3.5 text-red-500" />;
           }

           return (
            <div key={task.id} className={`p-2.5 rounded border text-left transition-all ${statusColor}`}>
                <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{icon}</div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[9px] font-mono opacity-50">{task.id}</span>
                            {task.status === TaskStatus.FAILED && (
                                <span className="text-[8px] bg-red-500/20 text-red-400 px-1 py-px rounded uppercase tracking-wider font-bold">
                                    Failed
                                </span>
                            )}
                        </div>
                        <p className={`text-xs leading-tight ${task.status === TaskStatus.PASSED ? 'line-through decoration-slate-700' : ''}`}>
                            {task.description}
                        </p>
                    </div>
                </div>
            </div>
           );
        })}
    </div>
  );
};

export default TaskList;
