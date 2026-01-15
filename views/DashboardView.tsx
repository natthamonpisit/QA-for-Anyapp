
import React, { useState } from 'react';
import { Home, Trash2, RotateCw, Play, FileCode, Bug, Search, LogOut, Save, Check, Github, X, ChevronDown, ChevronUp, LayoutDashboard, Maximize2, Minimize2 } from 'lucide-react';
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

// --- Internal Collapsible Wrapper ---
const Panel: React.FC<{ 
    title: React.ReactNode; 
    children: React.ReactNode; 
    defaultExpanded?: boolean; 
    className?: string;
    headerAction?: React.ReactNode;
}> = ({ title, children, defaultExpanded = true, className = "", headerAction }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className={`flex flex-col bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-sm backdrop-blur-sm transition-all duration-300 ${className} ${isExpanded ? 'h-full min-h-[200px]' : 'h-auto min-h-0'}`}>
            <div 
                className="flex items-center justify-between px-3 py-2 bg-slate-900/60 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/50 transition-colors select-none"
                onClick={(e) => {
                    // Prevent toggle if clicking on header actions
                    if ((e.target as HTMLElement).closest('.no-toggle')) return;
                    setIsExpanded(!isExpanded);
                }}
            >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <button className="text-slate-500 hover:text-white transition-colors">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                    </button>
                    {title}
                </div>
                <div className="flex items-center gap-2 no-toggle">
                    {headerAction}
                </div>
            </div>
            {isExpanded && (
                <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
                    {children}
                </div>
            )}
        </div>
    );
};

const DashboardView: React.FC<DashboardViewProps> = ({ qa, gh }) => {
  const { state: qaState, actions: qaActions } = qa;
  const { state: ghState, actions: ghActions } = gh;
  const [isSaved, setIsSaved] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Helper for tokens
  const estimatedTokens = Math.ceil(qaState.codeContext.length / 4);

  const handleSave = () => {
      qaActions.saveProject();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="h-screen bg-[#0b1121] text-slate-200 flex flex-col overflow-hidden relative">
      {/* 1. Top Header Bar */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0b1121] z-20">
        <div className="flex items-center gap-3">
            <button 
                className="flex items-center gap-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-700" 
                onClick={() => qaActions.setView('ONBOARDING')}
                title="Back to Project Catalog"
            >
                 <Home className="w-4 h-4" />
            </button>
            <div>
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    {qaState.currentRepoName || ghState.repoInput || 'Project QA'} 
                </h1>
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Mission Control
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2">
           {/* GitHub Token */}
           <div className="relative">
               <button 
                 onClick={() => setShowTokenInput(!showTokenInput)}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all border text-xs font-medium ${ghState.githubToken ? 'bg-green-900/20 border-green-900/50 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
               >
                  <Github className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{ghState.githubToken ? 'Connected' : 'Connect GitHub'}</span>
               </button>

               {showTokenInput && (
                <div className="absolute top-10 right-0 z-50 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-2xl w-72 animate-slideDown">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-semibold text-white">GitHub Access Token</h3>
                        <button onClick={() => setShowTokenInput(false)}><X className="w-3 h-3 text-slate-500 hover:text-white"/></button>
                    </div>
                    <input 
                        type="password" 
                        value={ghState.githubToken}
                        onChange={(e) => ghActions.setGithubToken(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white mb-3 focus:border-blue-500 focus:outline-none"
                        placeholder="ghp_..."
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowTokenInput(false)} className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 font-medium">Done</button>
                    </div>
                </div>
               )}
           </div>

           <button 
             onClick={handleSave} 
             className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all border text-xs font-medium ${isSaved ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
           >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
           </button>
           
           <div className="h-5 w-px bg-slate-800 mx-1"></div>

          <button onClick={qaActions.startMission} disabled={qaState.isProcessing || !process.env.API_KEY} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all shadow-lg ${qaState.isProcessing ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
            {qaState.isProcessing ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {qaState.isProcessing ? 'Running...' : 'Start QA'}
          </button>
        </div>
      </header>

      {/* 2. Main Content Grid (Single Page) */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        
        {/* Stats Row */}
        <div className="shrink-0">
            <DashboardStats tasks={qaState.tasks} currentCycle={qaState.currentCycle} />
        </div>

        {/* Bento Grid Layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4 min-h-0">
            
            {/* Col 1: Task List (Left) */}
            <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-4 min-h-0">
                <Panel title="Test Plan" className="flex-1" defaultExpanded={true}>
                    <TaskList tasks={qaState.tasks} />
                </Panel>
            </div>

            {/* Col 2: Active Monitor & Logs (Center - Main Focus) */}
            <div className="md:col-span-2 lg:col-span-5 flex flex-col gap-4 min-h-0">
                 {/* Top: Active Monitor */}
                 <Panel 
                    title={
                        <span className="flex items-center gap-2">
                           Simulation Runtime 
                           {qaState.isProcessing && <span className="flex w-2 h-2 rounded-full bg-red-500 animate-pulse"/>}
                        </span>
                    }
                    className="flex-[2]" 
                    defaultExpanded={true}
                 >
                    <ActiveTaskMonitor 
                        tasks={qaState.tasks} 
                        githubToken={ghState.githubToken}
                        onApplyFix={(taskId) => qaActions.applyFixAndPR(taskId, ghState.githubToken)}
                    />
                 </Panel>
                 
                 {/* Bottom: Agent Logs */}
                 <Panel 
                    title="System Logs" 
                    className="flex-1" 
                    defaultExpanded={true}
                    headerAction={
                        <button onClick={qaActions.handleLogUpload} className="text-xs text-slate-500 hover:text-blue-400" title="Export Log">
                            <Save className="w-3 h-3" />
                        </button>
                    }
                 >
                    <AgentLog logs={qaState.logs} />
                 </Panel>
            </div>

            {/* Col 3: Report & Context (Right) */}
            <div className="md:col-span-4 lg:col-span-4 flex flex-col gap-4 min-h-0">
                {/* Progress Report */}
                <Panel 
                    title="Progress Report" 
                    className="flex-[2]" 
                    defaultExpanded={true}
                >
                    <ProgressReport 
                        report={qaState.progressReport} 
                        onUpload={() => qaActions.handleCloudUpload(true)} 
                        cloudinaryConfig={qaState.cloudinaryConfig} 
                        onUpdateCloudConfig={qaActions.setCloudConfig} 
                    />
                </Panel>
                
                {/* Code Context / File Browser */}
                <Panel 
                    title={`Code Context (~${estimatedTokens.toLocaleString()} tokens)`}
                    className="flex-1"
                    defaultExpanded={false}
                    headerAction={
                         <button onClick={() => ghActions.setShowBrowser(!ghState.showBrowser)} className="text-[10px] text-blue-400 hover:text-white flex items-center gap-1">
                             <Search className="w-3 h-3" /> {ghState.showBrowser ? 'Hide Browser' : 'Browse Files'}
                         </button>
                    }
                >
                     {ghState.showBrowser ? (
                        <FileBrowser 
                            files={ghState.files} currentPath={ghState.currentPath} repoName={ghState.repoInput} selectedPaths={ghState.selectedPaths} isLoading={ghState.isLoading}
                            onNavigate={ghActions.navigate} onToggle={ghActions.toggleSelection} 
                            onImport={() => { ghActions.importSelected(); ghActions.setShowBrowser(false); }}
                            onClose={() => ghActions.setShowBrowser(false)} isDashboardMode
                        />
                    ) : (
                         <textarea className="w-full h-full bg-[#050505] text-[10px] font-mono p-3 text-slate-500 resize-none focus:outline-none" value={qaState.codeContext.substring(0, 2000) + (qaState.codeContext.length > 2000 ? '...' : '')} readOnly />
                    )}
                </Panel>
            </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardView;
