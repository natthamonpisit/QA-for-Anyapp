
import React from 'react';
import { BrainCircuit, Github, RotateCw, Key, CheckCheck, LogOut, Lock, Folder, Terminal } from 'lucide-react';
import FileBrowser from '../components/FileBrowser';

interface OnboardingViewProps {
  gh: any; // Using any for brevity in prop passing, strictly typed in hook
  onProceed: () => void;
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ gh, onProceed }) => {
  const { state, actions } = gh;

  return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[128px]" />

        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 relative z-10 flex flex-col gap-6 h-[85vh] md:h-[600px]">
          
          <div className="text-center space-y-2 shrink-0">
            <div className="bg-blue-600/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
               <BrainCircuit className="w-7 h-7 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">QA for Anyapp</h1>
            <p className="text-slate-400 text-sm">Automated AI Testing Agent for your GitHub Repositories</p>
          </div>

          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {!state.isConnected ? (
              <div className="flex flex-col gap-4 shrink-0">
                {!state.isTokenMode ? (
                  <div className="flex flex-col gap-3">
                     <button onClick={() => actions.setIsTokenMode(true)} className="w-full bg-[#24292f] hover:bg-[#2b3137] text-white p-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-lg border border-transparent hover:border-slate-600">
                        <Github className="w-5 h-5" /> Connect GitHub Account
                     </button>
                     <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="h-px bg-slate-800 flex-1"></div><span>OR PUBLIC REPO</span><div className="h-px bg-slate-800 flex-1"></div>
                     </div>
                     <div className="flex gap-2">
                        <input type="text" className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-sm px-4 py-2 rounded-lg focus:border-blue-500 focus:outline-none" placeholder="facebook/react" value={state.repoInput} onChange={(e) => actions.setRepoInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && actions.fetchRepo()} />
                        <button onClick={() => actions.fetchRepo()} disabled={state.isLoading || !state.repoInput} className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded-lg text-sm">Go</button>
                     </div>
                  </div>
                ) : (
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-3 animate-fadeIn">
                     <div className="flex items-center justify-between">
                         <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Key className="w-4 h-4 text-yellow-500" /> Enter Token</h3>
                         <button onClick={() => actions.setIsTokenMode(false)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
                     </div>
                     <div className="flex gap-2">
                         <input type="password" className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded focus:border-blue-500 focus:outline-none" placeholder="ghp_..." value={state.githubToken} onChange={(e) => actions.setGithubToken(e.target.value)} />
                         <button onClick={actions.connect} disabled={state.isLoading} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-medium">{state.isLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : 'Connect'}</button>
                     </div>
                  </div>
                )}
              </div>
            ) : (
                <div className="flex items-center justify-between bg-green-900/20 border border-green-900/50 p-3 rounded-lg shrink-0">
                    <div className="flex items-center gap-2"><CheckCheck className="w-4 h-4 text-green-400" /><span className="text-green-200 text-sm font-medium">GitHub Connected</span></div>
                    <button onClick={actions.disconnect} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><LogOut className="w-3 h-3" /> Disconnect</button>
                </div>
            )}

            <div className="flex-1 flex flex-col min-h-0 bg-slate-950/30 rounded-lg border border-slate-800 overflow-hidden">
                {!state.files.length ? (
                    state.isConnected ? (
                        <div className="flex-1 overflow-y-auto p-2">
                            <div className="text-xs text-slate-500 px-2 py-2 font-bold uppercase">Your Repositories</div>
                            {state.userRepos.map((repo: any) => (
                                <div key={repo.id} onClick={() => actions.fetchRepo(repo.full_name)} className="flex items-center gap-3 p-3 hover:bg-slate-800 cursor-pointer border-b border-slate-800/50 transition-colors group">
                                    <div className={`p-1.5 rounded ${repo.private ? 'bg-yellow-900/20 text-yellow-500' : 'bg-blue-900/20 text-blue-400'}`}>{repo.private ? <Lock className="w-4 h-4" /> : <Folder className="w-4 h-4" />}</div>
                                    <div className="min-w-0"><div className="text-sm text-slate-200 font-medium truncate group-hover:text-blue-400">{repo.full_name}</div></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-3">
                           {!state.repoInput && !state.files.length && <><Terminal className="w-8 h-8 opacity-20" /><p className="text-sm">Connect GitHub or enter a repo to start.</p></>}
                           {state.repoInput && !state.files.length && state.isLoading && <div className="text-sm text-blue-400 flex items-center gap-2"><RotateCw className="w-4 h-4 animate-spin" /> Fetching...</div>}
                        </div>
                    )
                ) : (
                    <div className="flex-1 flex flex-col min-h-0">
                         <div className="p-2 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-mono truncate">{state.repoInput}/{state.currentPath}</span>
                            <button onClick={() => { actions.setShowBrowser(false); actions.setRepoInput(''); actions.navigate(''); }} className="text-xs text-slate-500 hover:text-white">Close</button>
                        </div>
                        <FileBrowser 
                            files={state.files} currentPath={state.currentPath} repoName={state.repoInput} selectedPaths={state.selectedPaths} isLoading={state.isLoading}
                            onNavigate={actions.navigate} onToggle={actions.toggleSelection} 
                            onImport={() => { actions.importSelected(); onProceed(); }}
                        />
                    </div>
                )}
            </div>
          </div>
          <div className="text-center text-[10px] text-slate-600 shrink-0">Powered by Google Gemini 3 Flash • Secure Client-Side Only</div>
        </div>
      </div>
  );
};

export default OnboardingView;
