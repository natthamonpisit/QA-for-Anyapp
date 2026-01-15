
import React, { useEffect } from 'react';
import { BrainCircuit, Github, RotateCw, Key, CheckCheck, LogOut, Lock, Folder, Terminal, ArrowRight, ExternalLink, Play, Search, Loader2 } from 'lucide-react';

interface OnboardingViewProps {
  gh: any; 
  onProceed: () => void;
  qa?: any; // Add QA prop to trigger analysis
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ gh, onProceed, qa }) => {
  const { state: ghState, actions: ghActions } = gh;
  const { state: qaState, actions: qaActions } = qa;

  const openGitHubTokenPage = () => {
    const url = 'https://github.com/settings/tokens/new?description=QA-Agent-Session&scopes=repo';
    window.open(url, '_blank');
  };

  const selectAndAnalyze = async (repo: any) => {
      // 1. Clone
      await ghActions.autoClone(repo);
  };
  
  // Watch for codeContext changes to trigger Analysis automatically IF we are in onboarding
  useEffect(() => {
      if (qaState.codeContext && !qaState.functionSummary && qaState.workflowStep === 'IDLE') {
          qaActions.startAnalysis();
      }
  }, [qaState.codeContext]);


  return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-grid-pattern">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-4xl glass-panel rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] md:h-[600px] relative z-10 border border-slate-700/50">
          
          {/* Left Panel: Branding & Status */}
          <div className="md:w-1/3 bg-slate-900/80 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700/50 relative">
             <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
             <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                        <BrainCircuit className="w-6 h-6 text-blue-400" />
                    </div>
                    <span className="font-bold text-lg text-slate-100 tracking-tight">QA Agent</span>
                </div>
                
                {qaState.workflowStep === 'ANALYZING' || ghState.isLoading ? (
                    <div className="animate-fadeIn">
                        <h2 className="text-xl font-bold text-white mb-2">กำลังวิเคราะห์ระบบ</h2>
                        <p className="text-slate-400 text-sm mb-6">Architect Agent กำลังทำแผนผังโครงสร้าง Code...</p>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm text-slate-300">
                                <div className={`p-1.5 rounded-full ${ghState.isLoading ? 'bg-yellow-500/20 text-yellow-500 animate-pulse' : 'bg-green-500/20 text-green-500'}`}>
                                    {ghState.isLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                                </div>
                                <span>{ghState.isLoading ? ghState.loadingMessage || 'กำลังโหลดไฟล์...' : 'นำเข้าไฟล์เรียบร้อย'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-300">
                                <div className={`p-1.5 rounded-full ${qaState.workflowStep === 'ANALYZING' ? 'bg-purple-500/20 text-purple-500 animate-pulse' : 'bg-slate-800 text-slate-600'}`}>
                                    <BrainCircuit className="w-4 h-4" />
                                </div>
                                <span>สร้างสรุปโครงสร้างสถาปัตยกรรม...</span>
                            </div>
                        </div>
                    </div>
                ) : qaState.functionSummary ? (
                    <div className="animate-fadeIn">
                         <h2 className="text-xl font-bold text-white mb-2">พร้อมเริ่มงาน</h2>
                         <p className="text-slate-400 text-sm mb-6">วิเคราะห์ระบบเสร็จสมบูรณ์ กรุณาตรวจสอบสรุปด้านขวาก่อนเริ่มภารกิจ QA</p>
                         <button onClick={onProceed} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 group transition-all">
                             <Play className="w-5 h-5 fill-current" />
                             เริ่ม QA Mission!
                         </button>
                    </div>
                ) : (
                    <div>
                        <h1 className="text-3xl font-bold text-white leading-tight mb-4">
                            ระบบตรวจสอบ <br/>
                            <span className="text-blue-400">คุณภาพอัตโนมัติ</span>
                        </h1>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            เชื่อมต่อ Repository ของคุณ แล้วปล่อยให้ AI Agent วิเคราะห์ ทดสอบ และแก้ไขโค้ดให้อัตโนมัติ
                        </p>
                    </div>
                )}
             </div>
             
             {!qaState.functionSummary && !ghState.isLoading && qaState.workflowStep !== 'ANALYZING' && (
                <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        <span>ขับเคลื่อนด้วย Gemini 3 Flash</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span>ทำงานปลอดภัยแบบ Client-Side 100%</span>
                    </div>
                </div>
             )}
          </div>

          {/* Right Panel: Interactive */}
          <div className="md:w-2/3 p-6 md:p-8 flex flex-col bg-slate-950/30">
            {/* If Analysis is done, show Summary instead of repo list */}
            {qaState.functionSummary ? (
                <div className="flex flex-col h-full animate-fadeIn">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                             <Terminal className="w-5 h-5 text-purple-400" />
                             <h3 className="text-white font-semibold">สรุปโครงสร้างโดย Architect</h3>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{(qaState.codeContext.length / 1024).toFixed(1)} KB Source Code</span>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-slate-900/50 rounded-xl border border-slate-800 p-4 shadow-inner">
                        <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {qaState.functionSummary}
                        </pre>
                    </div>
                </div>
            ) : !ghState.isConnected ? (
              <div className="flex-1 flex flex-col justify-center gap-6 max-w-sm mx-auto w-full">
                {/* ... Connection UI (Same as before) ... */}
                <div className="text-center mb-4">
                    <h2 className="text-xl font-semibold text-white">เชื่อมต่อ Source Code</h2>
                    <p className="text-slate-500 text-sm mt-1">เลือกวิธีการเพื่อนำเข้าโปรเจกต์ของคุณ</p>
                </div>

                {!ghState.isTokenMode ? (
                  <div className="space-y-4">
                     <button onClick={() => ghActions.setIsTokenMode(true)} className="w-full bg-[#24292f] hover:bg-[#2b3137] text-white py-3 px-4 rounded-xl flex items-center justify-center gap-3 font-medium transition-all shadow-lg group">
                        <Github className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                        <span>เข้าสู่ระบบด้วย GitHub Token</span>
                     </button>
                  </div>
                ) : (
                  <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50 space-y-5 animate-fadeIn">
                     <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
                         <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Key className="w-4 h-4 text-yellow-500" /> Access Token</h3>
                         <button onClick={() => ghActions.setIsTokenMode(false)} className="text-xs text-slate-500 hover:text-slate-300">ย้อนกลับ</button>
                     </div>
                     <div className="space-y-2">
                        <button onClick={openGitHubTokenPage} className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 text-slate-300 px-3 py-2 rounded text-xs transition-colors group">
                            <span className="flex items-center gap-2"><Github className="w-3.5 h-3.5"/> สร้าง Token บน GitHub</span>
                            <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                        </button>
                     </div>
                     <div className="space-y-2">
                        <div className="relative">
                            <input type="password" className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm pl-3 pr-10 py-2.5 rounded-lg focus:border-green-500 focus:outline-none transition-colors" placeholder="ghp_..." value={ghState.githubToken} onChange={(e) => ghActions.setGithubToken(e.target.value)} />
                            <div className="absolute right-3 top-2.5 text-slate-600"><Key className="w-4 h-4" /></div>
                        </div>
                     </div>
                     <button onClick={ghActions.connect} disabled={ghState.isLoading || !ghState.githubToken} className="w-full bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2 mt-2 shadow-lg shadow-green-900/20">
                        {ghState.isLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : 'เชื่อมต่อ & วิเคราะห์'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
                <div className="flex flex-col h-full">
                    {/* Repo Selection Screen */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                            <div className="bg-green-500/10 p-1.5 rounded-full"><CheckCheck className="w-4 h-4 text-green-400" /></div>
                            <span className="text-slate-200 font-medium text-sm">เลือก Repository ที่ต้องการสแกน</span>
                        </div>
                        <button onClick={ghActions.disconnect} className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"><LogOut className="w-3 h-3" /> ออกจากระบบ</button>
                    </div>

                    <div className="flex-1 min-h-0 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden flex flex-col relative">
                        {ghState.isLoading || qaState.workflowStep === 'ANALYZING' ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-20 backdrop-blur-sm">
                                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                                <div className="text-white font-medium mb-1">{ghState.loadingMessage || 'กำลังประมวลผลระบบ...'}</div>
                                <div className="text-slate-500 text-xs">อาจใช้เวลาสักครู่ ขึ้นอยู่กับขนาดของ Repo</div>
                            </div>
                        ) : null}

                        <div className="flex-1 overflow-y-auto p-2">
                            {ghState.userRepos.map((repo: any) => (
                                <button key={repo.id} onClick={() => selectAndAnalyze(repo)} className="w-full text-left flex items-center gap-3 p-3 hover:bg-slate-800/80 border-b border-slate-800/50 transition-colors group">
                                    <div className={`p-1.5 rounded-lg ${repo.private ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-400'}`}>{repo.private ? <Lock className="w-4 h-4" /> : <Folder className="w-4 h-4" />}</div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm text-slate-200 font-medium truncate group-hover:text-blue-400 transition-colors">{repo.full_name}</div>
                                        <div className="text-[10px] text-slate-500 truncate">{repo.description || 'ไม่มีรายละเอียด'}</div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white text-[10px] px-2 py-1 rounded">
                                        สแกนเลย
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default OnboardingView;
