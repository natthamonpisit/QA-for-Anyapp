
import React, { useEffect, useState } from 'react';
import { BrainCircuit, Github, RotateCw, Key, CheckCheck, LogOut, Lock, Folder, Terminal, ArrowRight, ExternalLink, Play, Search, Loader2, History, Plus, LayoutGrid, ChevronLeft, Save, HardDriveDownload } from 'lucide-react';
import { RepoCatalogItem } from '../types';

interface OnboardingViewProps {
  gh: any; 
  onProceed: () => void;
  qa?: any; // Add QA prop to trigger analysis
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ gh, onProceed, qa }) => {
  const { state: ghState, actions: ghActions } = gh;
  const { state: qaState, actions: qaActions } = qa;
  
  // Local state for UI tabs/modes
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'NEW'>('NEW');

  const openGitHubTokenPage = () => {
    const url = 'https://github.com/settings/tokens/new?description=QA-Agent-Session&scopes=repo';
    window.open(url, '_blank');
  };

  const handleAnalyzeRepo = async (repoFullName: string, fromCatalog: boolean = false) => {
      if (!ghState.isConnected && !ghState.githubToken && fromCatalog) {
          alert("กรุณาเชื่อมต่อ GitHub Token ก่อนเริ่มงาน (เพื่อความปลอดภัย Token จะไม่ถูกบันทึกถาวร)");
          setActiveTab('NEW');
          ghActions.setIsTokenMode(true);
          return;
      }

      const repoObj = { full_name: repoFullName, default_branch: 'main' }; // Mock object for clone
      await ghActions.autoClone(repoObj as any);
  };

  const handleResumeSession = (item: RepoCatalogItem) => {
      if (item.savedState) {
          // 1. Load Session State
          qaActions.loadSession(item.savedState);
          // 2. Set UI Context for Github (visual only, real code is in savedState)
          ghActions.setRepoInput(item.id);
          // 3. Go to Dashboard
          qaActions.setView('DASHBOARD');
      }
  };
  
  // Watch for codeContext changes to trigger Analysis automatically
  useEffect(() => {
      // Only trigger if we are in IDLE, have code, and NO summary yet.
      if (qaState.codeContext && !qaState.functionSummary && qaState.workflowStep === 'IDLE' && !ghState.isLoading) {
          // Pass currentRepoName from state to analysis
          qaActions.startAnalysis(undefined, qaState.currentRepoName);
      }
  }, [qaState.codeContext, ghState.isLoading]);


  return (
      <div className="min-h-screen flex flex-col p-4 relative overflow-hidden bg-grid-pattern">
        
        {/* Header / Nav */}
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between py-6 z-10 relative">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30 backdrop-blur-md">
                    <BrainCircuit className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h1 className="font-bold text-xl text-slate-100 tracking-tight leading-none">QA Agent</h1>
                    <span className="text-[10px] text-slate-500 font-mono">Autonomous Quality Assurance</span>
                </div>
             </div>
             
             {ghState.isConnected && (
                 <div className="flex items-center gap-4">
                     <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs text-slate-300">Connected: {ghState.userRepos[0]?.owner?.login || 'User'}</span>
                     </div>
                     <button onClick={ghActions.disconnect} className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors">
                        <LogOut className="w-4 h-4" />
                     </button>
                 </div>
             )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6 z-10 relative mt-4">
            
            {/* Left Column: Menu & Actions */}
            <div className="md:w-1/4 flex flex-col gap-4">
                <nav className="flex flex-col gap-2">
                    <button 
                        onClick={() => setActiveTab('NEW')}
                        className={`text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'NEW' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                    >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium text-sm">เริ่มโปรเจคใหม่</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('CATALOG')}
                        className={`text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'CATALOG' ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                    >
                        <History className="w-5 h-5" />
                        <span className="font-medium text-sm">ประวัติโปรเจค</span>
                        {qaState.repoCatalog.length > 0 && <span className="ml-auto text-[10px] bg-slate-700 px-1.5 py-0.5 rounded-full">{qaState.repoCatalog.length}</span>}
                    </button>
                </nav>

                <div className="mt-auto p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-500 leading-relaxed">
                    <div className="flex items-center gap-2 mb-2 text-slate-300 font-semibold"><Lock className="w-3 h-3"/> Privacy First</div>
                    ระบบทำงานแบบ Client-Side 100% ข้อมูล Code ของคุณจะไม่ถูกส่งไปเก็บที่ Server ของเรา (ยกเว้นส่งไปประมวลผลที่ Gemini API)
                </div>
            </div>

            {/* Right Column: Display Area */}
            <div className="md:w-3/4 glass-panel rounded-2xl border border-slate-700/50 p-6 min-h-[500px] flex flex-col relative overflow-hidden">
                
                {/* Global Loading Overlay */}
                {(ghState.isLoading || qaState.workflowStep === 'ANALYZING') && (
                    <div className="absolute inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center backdrop-blur-sm animate-fadeIn">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin relative z-10" />
                        </div>
                        <h2 className="text-xl font-bold text-white mt-6 mb-2">
                             {qaState.workflowStep === 'ANALYZING' ? 'กำลังวิเคราะห์โครงสร้าง...' : 'กำลังดึงข้อมูล...'}
                        </h2>
                        <div className="flex flex-col items-center gap-1">
                            {ghState.repoInput && <div className="text-blue-400 font-mono text-sm">{ghState.repoInput}</div>}
                            <p className="text-slate-400 text-sm">{ghState.loadingMessage || 'Architect Agent is mapping the matrix...'}</p>
                        </div>
                    </div>
                )}

                {/* Analysis Success State */}
                {qaState.functionSummary && qaState.workflowStep === 'IDLE' ? (
                     <div className="flex flex-col h-full animate-fadeIn">
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <CheckCheck className="w-6 h-6 text-green-400" />
                                    พร้อมเริ่มภารกิจ
                                </h2>
                                <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                                    Repository: 
                                    <span className="text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                        {qaState.currentRepoName || ghState.repoInput || 'Unknown Repo'}
                                    </span>
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => qaActions.clearSession()} className="text-slate-400 hover:text-white px-4 py-3 rounded-xl font-medium border border-slate-700 hover:bg-slate-800 transition-colors flex items-center gap-2">
                                    <ChevronLeft className="w-4 h-4" />
                                    Back
                                </button>
                                <button onClick={onProceed} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-105">
                                    <Play className="w-5 h-5 fill-current" />
                                    เข้าสู่ Mission Control
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-800 p-6 shadow-inner overflow-hidden flex flex-col">
                            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><Terminal className="w-4 h-4 text-purple-400"/> Architect Summary</h3>
                            <div className="flex-1 overflow-y-auto pr-2">
                                <pre className="text-xs font-mono text-slate-400 whitespace-pre-wrap leading-relaxed">{qaState.functionSummary}</pre>
                            </div>
                        </div>
                     </div>
                ) : (
                    <>
                        {/* TAB: NEW PROJECT (Default) */}
                        {activeTab === 'NEW' && (
                            <div className="animate-fadeIn h-full flex flex-col">
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Github className="w-5 h-5 text-green-400" /> เชื่อมต่อ GitHub
                                </h2>

                                {!ghState.isConnected ? (
                                    <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
                                        {!ghState.isTokenMode ? (
                                            <div className="space-y-6 text-center">
                                                <div className="p-6 bg-slate-900 rounded-full w-20 h-20 mx-auto flex items-center justify-center border border-slate-700 shadow-xl">
                                                    <Key className="w-8 h-8 text-yellow-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-medium text-white">ยืนยันตัวตนด้วย Token</h3>
                                                    <p className="text-slate-400 text-sm mt-2">เพื่อเข้าถึง Private Repo และหลีกเลี่ยง Rate Limit</p>
                                                </div>
                                                <button onClick={() => ghActions.setIsTokenMode(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-3 font-medium transition-all border border-slate-600">
                                                    ใส่ GitHub Token
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 space-y-5 animate-slideUp">
                                                <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
                                                    <h3 className="text-sm font-semibold text-white">Access Token</h3>
                                                    <button onClick={() => ghActions.setIsTokenMode(false)} className="text-xs text-slate-500 hover:text-slate-300">ย้อนกลับ</button>
                                                </div>
                                                <button onClick={openGitHubTokenPage} className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 px-3 py-2 rounded text-xs transition-colors group">
                                                    <span className="flex items-center gap-2"><Github className="w-3.5 h-3.5"/> สร้าง Token (Auto-Scope)</span>
                                                    <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                                </button>
                                                <div className="relative">
                                                    <input type="password" className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm pl-3 pr-10 py-2.5 rounded-lg focus:border-green-500 focus:outline-none" placeholder="ghp_..." value={ghState.githubToken} onChange={(e) => ghActions.setGithubToken(e.target.value)} />
                                                    <div className="absolute right-3 top-2.5 text-slate-600"><Key className="w-4 h-4" /></div>
                                                </div>
                                                <button onClick={ghActions.connect} disabled={ghState.isLoading || !ghState.githubToken} className="w-full bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2">
                                                    {ghState.isLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : 'เชื่อมต่อ'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col min-h-0 bg-slate-900/30 rounded-xl border border-slate-800/50">
                                        <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-xl">
                                            <span className="text-xs text-slate-400 font-medium">Repository List</span>
                                            <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full">{ghState.userRepos.length} Repos</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2">
                                            {ghState.userRepos.map((repo: any) => (
                                                <button key={repo.id} onClick={() => handleAnalyzeRepo(repo.full_name)} className="w-full text-left flex items-center gap-3 p-3 hover:bg-slate-800 border-b border-slate-800/30 transition-colors group rounded-lg mb-1">
                                                    <div className={`p-2 rounded-lg ${repo.private ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-400'}`}>{repo.private ? <Lock className="w-4 h-4" /> : <Folder className="w-4 h-4" />}</div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm text-slate-200 font-medium truncate group-hover:text-blue-400 transition-colors">{repo.full_name}</div>
                                                        <div className="text-[10px] text-slate-500 truncate">{repo.description || 'No description'}</div>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white text-[10px] px-3 py-1.5 rounded-md font-medium shadow-lg">
                                                        Analyze
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* TAB: CATALOG */}
                        {activeTab === 'CATALOG' && (
                            <div className="animate-fadeIn h-full flex flex-col">
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <LayoutGrid className="w-5 h-5 text-purple-400" /> โปรเจคที่เคยทำ (Recent Projects)
                                </h2>
                                
                                {qaState.repoCatalog.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 border-2 border-dashed border-slate-800 rounded-xl">
                                        <Folder className="w-12 h-12 opacity-20" />
                                        <p>ยังไม่มีประวัติโปรเจค</p>
                                        <button onClick={() => setActiveTab('NEW')} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                                            + เริ่มโปรเจคแรกของคุณ
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 pb-4">
                                        {qaState.repoCatalog.map((item: RepoCatalogItem) => (
                                            <div
                                                key={item.id}
                                                className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex flex-col gap-3 relative overflow-hidden group hover:bg-slate-800 hover:border-slate-600 transition-all"
                                            >
                                                <div className="flex items-start justify-between w-full">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:text-blue-300"><Github className="w-5 h-5"/></div>
                                                        <div>
                                                            <h3 className="font-semibold text-slate-200 group-hover:text-white line-clamp-1" title={item.name}>{item.name}</h3>
                                                            <p className="text-[10px] text-slate-500 font-mono truncate">{item.id}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed h-8">
                                                    {item.description}
                                                </div>
                                                <div className="mt-auto pt-3 border-t border-slate-700/30 flex items-center justify-between gap-2">
                                                    <span className="text-[10px] text-slate-600">Updated: {new Date(item.lastAnalyzed).toLocaleDateString()}</span>
                                                    
                                                    {item.savedState ? (
                                                        <button 
                                                            onClick={() => handleResumeSession(item)}
                                                            className="flex items-center gap-1.5 text-[10px] bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors shadow-lg shadow-green-900/20"
                                                        >
                                                            <HardDriveDownload className="w-3 h-3" /> Resume
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleAnalyzeRepo(item.id, true)}
                                                            className="flex items-center gap-1.5 text-[10px] bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                                                        >
                                                            <RotateCw className="w-3 h-3" /> Re-Analyze
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
      </div>
  );
};

export default OnboardingView;
