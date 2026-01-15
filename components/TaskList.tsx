
import React from 'react';
import { Task, TaskStatus } from '../types';
import { CheckCircle, XCircle, CircleDashed, Loader2, ListTodo, AlertTriangle } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 flex flex-col h-full shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur p-3 border-b border-slate-700 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-blue-400" />
            <h2 className="font-semibold text-slate-200 text-sm">รายการทดสอบ (Test Tasks)</h2>
        </div>
        <span className="text-[10px] font-mono bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
            {tasks.length} รายการ
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-xs gap-2">
                <CircleDashed className="w-6 h-6 opacity-50" />
                <span>ยังไม่มีรายการทดสอบ</span>
            </div>
        )}

        {tasks.map((task) => {
           let statusColor = "border-slate-800 bg-slate-800/50";
           let icon = <CircleDashed className="w-4 h-4 text-slate-500" />;
           
           if (task.status === TaskStatus.RUNNING) {
               statusColor = "border-blue-500/50 bg-blue-900/10 shadow-[0_0_10px_rgba(59,130,246,0.1)]";
               icon = <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
           } else if (task.status === TaskStatus.PASSED) {
               statusColor = "border-green-900/50 bg-green-900/10 opacity-70";
               icon = <CheckCircle className="w-4 h-4 text-green-500" />;
           } else if (task.status === TaskStatus.FAILED) {
               statusColor = "border-red-900/50 bg-red-900/10";
               icon = <XCircle className="w-4 h-4 text-red-500" />;
           }

           return (
            <div key={task.id} className={`p-3 rounded-lg border text-left transition-all hover:bg-slate-800 ${statusColor}`}>
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{icon}</div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-mono text-slate-500">{task.id}</span>
                            {task.status === TaskStatus.FAILED && (
                                <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Failed
                                </span>
                            )}
                        </div>
                        <p className={`text-xs font-medium leading-tight ${task.status === TaskStatus.PASSED ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-200'}`}>
                            {task.description}
                        </p>
                    </div>
                </div>
            </div>
           );
        })}
      </div>
    </div>
  );
};

export default TaskList;
