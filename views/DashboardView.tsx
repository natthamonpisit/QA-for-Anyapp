
import React from 'react';
import { Home, Trash2, RotateCw, Play, FileCode, Bug, Search } from 'lucide-react';
import DashboardStats from '../components/DashboardStats';
import TaskList from '../components/TaskList';
import ActiveTaskMonitor from '../components/ActiveTaskMonitor';
import AgentLog from '../components/AgentLog';
import ProgressReport from '../components/ProgressReport';
import FileBrowser from '../components/FileBrowser';

interface DashboardViewProps {
  qa: any; // Hook types
  gh: any; // Hook types
}

const DashboardView: React.FC<DashboardViewProps> = ({ qa, gh }) => {
  const { state: qaState, actions: qaActions } = qa;
  const { state: ghState, actions: ghActions } = gh;

  // Helper for tokens
  const estimatedTokens = Math.ceil(qaState.codeContext.length / 4);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col p-4 md:p-6 gap-6">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => qaActions.setView('ONBOARDING')}>
                 <Home className="w-5 h-5" />
            </div>
            <div className="h-6 w-px bg-slate-700 mx-1"></div>
            <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    {ghState.repoInput || 'Session'} 
                    <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">Mission Control</span>
                </h1>
            </div>
        </div>

        <div className="flex items-center gap-4">
           <button onClick={() => { if(window.confirm("Clear?")) { qaActions.clearSession(); ghActions.disconnect(); } }} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors" title="Clear Session"><Trash2 className="w-4 h-4" /></button>

          <button onClick={qaActions.startAnalysis} disabled={qaState.isProcessing || !process.env.API_KEY} className={`flex items-center gap-2 px-6 py-2.5 rounded-md font-medium transition-all shadow-lg ${qaState.isProcessing ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
            {qaState.isProcessing ? <RotateCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            {qaState.isProcessing ? 'Working...' : 'Start Cycle'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0 gap-6">
        <DashboardStats tasks={qaState.tasks} currentCycle={qaState.currentCycle} />
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
            <div className="lg:col-span-3 flex flex-col gap-4 min-h-[400px]">
                <TaskList tasks={qaState.tasks} />
            </div>
            <div className="lg:col-span-5 flex flex-col gap-4 min-h-[400px]">
                <div className="h-1/3 min-h-[180px]"><ActiveTaskMonitor tasks={qaState.tasks} /></div>
                <div className="flex-1 min-h-[300px]"><AgentLog logs={qaState.logs} /></div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-4 min-h-[400px]">
                <ProgressReport report={qaState.progressReport} onUpload={() => qaActions.handleCloudUpload(true)} cloudinaryConfig={qaState.cloudinaryConfig} onUpdateCloudConfig={qaActions.setCloudConfig} />
                
                {/* Code Context / File Browser Toggle */}
                <div className="h-1/3 bg-slate-900 rounded-lg border border-slate-700 flex flex-col overflow-hidden">
                    <div className="bg-slate-800 p-2 border-b border-slate-700 flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-2"><FileCode className="w-3 h-3" /> Context</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600">{estimatedTokens.toLocaleString()} tokens</span>
                            <button onClick={() => ghActions.setShowBrowser(!ghState.showBrowser)} className="text-[10px] text-blue-400 hover:text-white"><Search className="w-3 h-3" /></button>
                        </div>
                    </div>
                    {ghState.showBrowser ? (
                        <FileBrowser 
                            files={ghState.files} currentPath={ghState.currentPath} repoName={ghState.repoInput} selectedPaths={ghState.selectedPaths} isLoading={ghState.isLoading}
                            onNavigate={ghActions.navigate} onToggle={ghActions.toggleSelection} 
                            onImport={() => { ghActions.importSelected(); ghActions.setShowBrowser(false); }}
                            onClose={() => ghActions.setShowBrowser(false)} isDashboardMode
                        />
                    ) : (
                         <textarea className="flex-1 bg-slate-950 text-[10px] font-mono p-2 text-slate-500 resize-none focus:outline-none" value={qaState.codeContext.substring(0, 1000) + (qaState.codeContext.length > 1000 ? '...' : '')} readOnly />
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
