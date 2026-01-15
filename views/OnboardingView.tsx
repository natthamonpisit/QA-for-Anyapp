
import React from 'react';
import { BrainCircuit, Github, RotateCw, Key, CheckCheck, LogOut, Lock, Folder, Terminal, ArrowRight } from 'lucide-react';
import FileBrowser from '../components/FileBrowser';

interface OnboardingViewProps {
  gh: any; 
  onProceed: () => void;
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ gh, onProceed }) => {
  const { state, actions } = gh;

  return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-grid-pattern">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-4xl glass-panel rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] md:h-[600px] relative z-10 border border-slate-700/50">
          
          {/* Left Panel: Branding */}
          <div className="md:w-1/3 bg-slate-900/80 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700/50 relative">
             <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
             <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                        <BrainCircuit className="w-6 h-6 text-blue-400" />
                    </div>
                    <span className="font-bold text-lg text-slate-100 tracking-tight">QA Agent</span>
                </div>
                <h1 className="text-3xl font-bold text-white leading-tight mb-4">
                    Autonomous <br/>
                    <span className="text-blue-400">Quality Assurance</span>
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Connect your repository and let our AI agents analyze, test, and fix your code automatically.
                </p>
             </div>
             
             <div className="mt-8 space-y-4">
                 <div className="flex items-center gap-3 text-xs text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>Gemini 3 Flash Powered</span>
                 </div>
                 <div className="flex items-center gap-3 text-xs text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span>Secure Client-Side Execution</span>
                 </div>
             </div>
          </div>

          {/* Right Panel: Interactive */}
          <div className="md:w-2/3 p-6 md:p-8 flex flex-col bg-slate-950/30">
            {!state.isConnected ? (
              <div className="flex-1 flex flex-col justify-center gap-6 max-w-sm mx-auto w-full">
                <div className="text-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Connect Source Code</h2>
                    <p className="text-slate-500 text-sm mt-1">Select a method to import your project</p>
                </div>

                {!state.isTokenMode ? (
                  <div className="space-y-4">
                     <button onClick={() => actions.setIsTokenMode(true)} className="w-full bg-[#24292f] hover:bg-[#2b3137] text-white py-3 px-4 rounded-xl flex items-center justify-center gap-3 font-medium transition-all shadow-lg group">
                        <Github className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                        <span>Connect with GitHub Token</span>
                     </button>
                     
                     <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800"></span></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Or Public Repo</span></div>
                     </div>

                     <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-sm px-4 py-2.5 rounded-lg focus:border-blue-500 focus:outline-none transition-colors" 
                            placeholder="owner/repo" 
                            value={state.repoInput} 
                            onChange={(e) => actions.setRepoInput(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && actions.fetchRepo()} 
                        />
                        <button onClick={() => actions.fetchRepo()} disabled={state.isLoading || !state.repoInput} className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg flex items-center justify-center transition-colors">
                            <ArrowRight className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50 space-y-4 animate-fadeIn">
                     <div className="flex items-center justify-between">
                         <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Key className="w-4 h-4 text-yellow-500" /> Personal Access Token</h3>
                     </div>
                     <p className="text-xs text-slate-500">Token requires 'repo' scope for private repositories.</p>
                     <input 
                        type="password" 
                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm px-4 py-2.5 rounded-lg focus:border-blue-500 focus:outline-none" 
                        placeholder="ghp_xxxxxxxxxxxx" 
                        value={state.githubToken} 
                        onChange={(e) => actions.setGithubToken(e.target.value)} 
                     />
                     <div className="flex gap-3 pt-2">
                        <button onClick={() => actions.setIsTokenMode(false)} className="flex-1 text-sm text-slate-400 hover:text-white py-2">Cancel</button>
                        <button onClick={actions.connect} disabled={state.isLoading} className="flex-1 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2">
                            {state.isLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : 'Connect'}
                        </button>
                     </div>
                  </div>
                )}
              </div>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                            <div className="bg-green-500/10 p-1.5 rounded-full"><CheckCheck className="w-4 h-4 text-green-400" /></div>
                            <span className="text-slate-200 font-medium text-sm">Connected</span>
                        </div>
                        <button onClick={actions.disconnect} className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"><LogOut className="w-3 h-3" /> Sign out</button>
                    </div>

                    <div className="flex-1 min-h-0 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
                        {!state.files.length ? (
                             <div className="flex-1 overflow-y-auto p-2">
                                <div className="text-[10px] text-slate-500 px-3 py-2 font-bold uppercase tracking-wider">Your Repositories</div>
                                {state.userRepos.map((repo: any) => (
                                    <button key={repo.id} onClick={() => actions.fetchRepo(repo.full_name)} className="w-full text-left flex items-center gap-3 p-3 hover:bg-slate-800/80 border-b border-slate-800/50 transition-colors group">
                                        <div className={`p-1.5 rounded-lg ${repo.private ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-400'}`}>{repo.private ? <Lock className="w-4 h-4" /> : <Folder className="w-4 h-4" />}</div>
                                        <div className="min-w-0">
                                            <div className="text-sm text-slate-200 font-medium truncate group-hover:text-blue-400 transition-colors">{repo.full_name}</div>
                                            <div className="text-[10px] text-slate-500 truncate">{repo.description || 'No description'}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                             <div className="flex-1 flex flex-col min-h-0">
                                <div className="p-3 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
                                    <span className="text-xs text-slate-300 font-mono truncate px-2 bg-slate-900 rounded py-1 border border-slate-700">{state.repoInput}</span>
                                    <button onClick={() => { actions.setShowBrowser(false); actions.setRepoInput(''); actions.navigate(''); }} className="text-xs text-slate-400 hover:text-white px-2">Change</button>
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
            )}
          </div>
        </div>
      </div>
  );
};

export default OnboardingView;
