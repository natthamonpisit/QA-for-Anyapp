import React, { useState, useReducer, useEffect, useCallback } from 'react';
import { 
  AppState, AgentRole, TaskStatus, Task, LogEntry, CloudinaryConfig 
} from './types';
import * as GeminiService from './services/geminiService';
import * as GithubService from './services/githubService';
import * as CloudinaryService from './services/cloudinaryService';
import AgentLog from './components/AgentLog';
import ProgressReport from './components/ProgressReport';
import TaskList from './components/TaskList';
import DashboardStats from './components/DashboardStats';
import ActiveTaskMonitor from './components/ActiveTaskMonitor';
import { BrainCircuit, Play, RotateCw, CheckCheck, Github, Bug, Search, FileCode, Folder, ArrowLeft, Terminal, Key, Lock, LogOut, PlusCircle, Trash2, Cpu, Save, Home } from 'lucide-react';

// Storage Keys
const STORAGE_KEY = 'QA_APP_STATE_V1';

// Initial State
const defaultState: AppState = {
  codeContext: '', 
  functionSummary: '',
  tasks: [],
  logs: [],
  progressReport: '# QA for Anyapp Progress Report\n----------------------------------\n',
  isProcessing: false,
  currentCycle: 0,
  maxCycles: 3,
  workflowStep: 'IDLE',
  currentView: 'ONBOARDING',
  cloudinaryConfig: { cloudName: '', uploadPreset: '' },
  sessionId: `qa_session_${Date.now()}` // Default ID
};

// Load initial state from LocalStorage if available
const loadState = (): AppState => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Revive date objects in logs
            if (parsed.logs) {
                parsed.logs = parsed.logs.map((l: any) => ({ ...l, timestamp: new Date(l.timestamp) }));
            }
            // Ensure compatibility
            return { 
              ...defaultState, 
              ...parsed, 
              isProcessing: false, 
              workflowStep: parsed.workflowStep === 'TESTING' ? 'IDLE' : parsed.workflowStep,
              cloudinaryConfig: parsed.cloudinaryConfig || defaultState.cloudinaryConfig,
              sessionId: parsed.sessionId || defaultState.sessionId
            };
        }
    } catch (e) {
        console.error("Failed to load state", e);
    }
    return defaultState;
};

// Reducer for complex state updates
type Action = 
  | { type: 'SET_CODE'; payload: string }
  | { type: 'APPEND_CODE'; payload: string }
  | { type: 'ADD_LOG'; payload: Omit<LogEntry, 'id' | 'timestamp'> }
  | { type: 'SET_STEP'; payload: AppState['workflowStep'] }
  | { type: 'SET_SUMMARY'; payload: string }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'UPDATE_REPORT'; payload: string }
  | { type: 'INCREMENT_CYCLE' }
  | { type: 'RESET_CYCLE' }
  | { type: 'FINISH_PROCESSING' }
  | { type: 'SET_VIEW'; payload: AppState['currentView'] }
  | { type: 'SET_CLOUD_CONFIG'; payload: CloudinaryConfig }
  | { type: 'CLEAR_SESSION' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_CODE':
      return { ...state, codeContext: action.payload };
    case 'APPEND_CODE':
      return { ...state, codeContext: state.codeContext + (state.codeContext ? '\n\n' : '') + action.payload };
    case 'ADD_LOG':
      return {
        ...state,
        logs: [...state.logs, { 
          id: Math.random().toString(36).substr(2, 9), 
          timestamp: new Date(), 
          ...action.payload 
        }],
      };
    case 'SET_STEP':
      return { ...state, workflowStep: action.payload, isProcessing: action.payload !== 'IDLE' && action.payload !== 'COMPLETED' };
    case 'SET_SUMMARY':
      return { ...state, functionSummary: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, ...action.payload.updates } : t),
      };
    case 'UPDATE_REPORT':
      return { ...state, progressReport: action.payload };
    case 'INCREMENT_CYCLE':
      return { ...state, currentCycle: state.currentCycle + 1 };
    case 'RESET_CYCLE':
      return { ...state, currentCycle: 0, tasks: [], logs: [], progressReport: defaultState.progressReport, workflowStep: 'IDLE' };
    case 'FINISH_PROCESSING':
      return { ...state, isProcessing: false, workflowStep: 'COMPLETED' };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_CLOUD_CONFIG':
      return { ...state, cloudinaryConfig: action.payload };
    case 'CLEAR_SESSION':
      localStorage.removeItem(STORAGE_KEY);
      return { ...defaultState, sessionId: `qa_session_${Date.now()}` };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, defaultState, loadState);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Persistence Effect
  useEffect(() => {
    const timeout = setTimeout(() => {
        try {
            const { isProcessing, ...stateToSave } = state;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (e) {
            console.error("Storage full or error", e);
        }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [state]);

  // GitHub State
  const [repoInput, setRepoInput] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [isTokenMode, setIsTokenMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userRepos, setUserRepos] = useState<GithubService.GithubRepo[]>([]);
  
  const [currentPath, setCurrentPath] = useState('');
  const [githubFiles, setGithubFiles] = useState<GithubService.GithubFile[]>([]);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [showGithubBrowser, setShowGithubBrowser] = useState(false);
  
  // Selection State
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (process.env.API_KEY) {
      setHasApiKey(true);
    }
  }, []);

  const addLog = (role: AgentRole, message: string, type: 'info'|'success'|'error'|'warning' = 'info') => {
    dispatch({ type: 'ADD_LOG', payload: { role, message, type } });
  };

  const updateReport = async (action: string, detail: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const newEntry = `\n[${timestamp}] [${action}] ${detail}`;
    // Return the new report string so we can use it immediately in other functions
    const newReport = state.progressReport + newEntry;
    dispatch({ type: 'UPDATE_REPORT', payload: newReport });
    return newReport;
  };
  
  const handleCloudUpload = async (manual: boolean = false, currentReportContent?: string) => {
    const { cloudName, uploadPreset } = state.cloudinaryConfig;
    // Silent fail if config not set during auto-upload
    if (!cloudName || !uploadPreset) {
        if (manual) alert("Please configure Cloudinary credentials (Cloud Name & Upload Preset) in the report settings first.");
        return;
    }
    
    if (manual) addLog(AgentRole.QA_LEAD, "Uploading report to Cloudinary...", 'info');
    
    try {
        const contentToUpload = currentReportContent || state.progressReport;
        // Use sessionId as publicId to overwrite/group files
        const url = await CloudinaryService.uploadReport(contentToUpload, state.cloudinaryConfig, state.sessionId);
        
        if (manual) {
            addLog(AgentRole.QA_LEAD, `Report uploaded successfully: ${url}`, 'success');
            window.open(url, '_blank');
        } else {
            // Log silently/less obtrusively for auto-saves
            addLog(AgentRole.QA_LEAD, `Auto-synced to Cloud: ${url}`, 'info');
        }
        
        // Only update the internal report text if manual (to avoid recursion loops)
        if (manual) updateReport("CLOUD_UPLOAD", `Report stored at: ${url}`);
        
    } catch (error: any) {
        if (manual) addLog(AgentRole.QA_LEAD, `Upload failed: ${error.message}`, 'error');
        else console.warn("Auto-upload failed:", error);
    }
  };

  const handleUpdateCloudConfig = (config: CloudinaryConfig) => {
      dispatch({ type: 'SET_CLOUD_CONFIG', payload: config });
  };

  // Helper to estimate tokens (Roughly 4 chars = 1 token)
  const estimatedTokens = Math.ceil(state.codeContext.length / 4);
  const tokenLimit = 1000000;
  const tokenPercentage = Math.min(100, (estimatedTokens / tokenLimit) * 100);

  // --- GITHUB AUTH & REPOS ---

  const handleConnectGithub = async () => {
    if (!githubToken) {
        alert("Please enter a Personal Access Token");
        return;
    }
    setIsGithubLoading(true);
    try {
        const repos = await GithubService.fetchUserRepos(githubToken);
        setUserRepos(repos);
        setIsConnected(true);
        setIsTokenMode(false);
    } catch (error: any) {
        alert("Connection failed: " + error.message);
    } finally {
        setIsGithubLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setGithubToken('');
    setUserRepos([]);
    setRepoInput('');
    setGithubFiles([]);
    setSelectedPaths(new Set());
  };

  // --- GITHUB FILE BROWSING ---

  const handleFetchRepo = async (repoName?: string) => {
    const targetRepo = repoName || repoInput;
    if (!targetRepo) return;
    if (repoName) setRepoInput(repoName);

    setIsGithubLoading(true);
    setCurrentPath('');
    setSelectedPaths(new Set()); 
    try {
      const files = await GithubService.fetchRepoContents(targetRepo, '', isConnected ? githubToken : undefined);
      setGithubFiles(files);
      setShowGithubBrowser(true);
    } catch (error: any) {
      alert(`Error fetching repo: ${error.message}`);
    } finally {
      setIsGithubLoading(false);
    }
  };

  const handleNavigateDir = async (path: string) => {
    setIsGithubLoading(true);
    try {
      const files = await GithubService.fetchRepoContents(repoInput, path, isConnected ? githubToken : undefined);
      setGithubFiles(files);
      setCurrentPath(path);
    } catch (error: any) {
      alert(`Error navigating: ${error.message}`);
    } finally {
      setIsGithubLoading(false);
    }
  };

  const toggleSelection = (file: GithubService.GithubFile) => {
    if (file.type === 'dir') return; 
    
    const newSet = new Set(selectedPaths);
    if (newSet.has(file.path)) {
      newSet.delete(file.path);
    } else {
      newSet.add(file.path);
    }
    setSelectedPaths(newSet);
  };

  const handleImportSelectedFiles = async () => {
    if (selectedPaths.size === 0) return;

    setIsGithubLoading(true);
    let importedCount = 0;
    const paths = Array.from(selectedPaths);

    try {
      for (const path of paths) {
        const file = githubFiles.find(f => f.path === path);
        if (file) {
            const content = await GithubService.fetchFileContent(repoInput, file.sha, isConnected ? githubToken : undefined);
            const formattedContent = `// === FILE: ${file.path} ===\n${content}`;
            dispatch({ type: 'APPEND_CODE', payload: formattedContent });
            importedCount++;
        }
      }
      
      addLog(AgentRole.ARCHITECT, `Imported ${importedCount} files to context.`, 'info');
      setSelectedPaths(new Set());
      
      if (state.currentView === 'ONBOARDING') {
        dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' });
      } else {
        setShowGithubBrowser(false); 
      }

    } catch (error: any) {
      alert(`Error importing files: ${error.message}`);
    } finally {
      setIsGithubLoading(false);
    }
  };

  // --- WORKFLOW ENGINE ---
  const startAnalysis = async () => {
    if (!hasApiKey) {
        alert("Please set your API_KEY in the environment.");
        return;
    }
    if (!state.codeContext.trim()) {
        alert("No code to analyze! Please import files from GitHub first.");
        return;
    }
    
    dispatch({ type: 'RESET_CYCLE' });
    dispatch({ type: 'SET_STEP', payload: 'ANALYZING' });
    addLog(AgentRole.ARCHITECT, "Starting detailed code analysis...", 'info');
    await updateReport("ANALYSIS", "Started reading code base for structural summary.");
    
    try {
      const summary = await GeminiService.analyzeCode(state.codeContext);
      dispatch({ type: 'SET_SUMMARY', payload: summary });
      addLog(AgentRole.ARCHITECT, "Code Structure Analyzed. Summary generated.", 'success');
      
      const newReport = await updateReport("ANALYSIS_COMPLETE", `Summary Generated:\n${summary.substring(0, 200)}...`);
      // Auto-upload
      handleCloudUpload(false, newReport);
      
      startPlanning(summary);
    } catch (error) {
      addLog(AgentRole.ARCHITECT, "Analysis Failed. Aborting.", 'error');
      dispatch({ type: 'FINISH_PROCESSING' });
    }
  };

  const startPlanning = async (summary: string) => {
    dispatch({ type: 'SET_STEP', payload: 'PLANNING' });
    addLog(AgentRole.QA_LEAD, "Generating granular test tasks...", 'info');
    try {
      // Pass progress report to planning to avoid repeats
      const tasks = await GeminiService.createTestPlan(state.codeContext, summary, state.progressReport);
      dispatch({ type: 'SET_TASKS', payload: tasks });
      addLog(AgentRole.QA_LEAD, `Generated ${tasks.length} tasks.`, 'success');
      
      const newReport = await updateReport("PLANNING", `Created ${tasks.length} new test tasks.`);
      // Auto-upload
      handleCloudUpload(false, newReport);

      startExecution(tasks);
    } catch (error) {
      addLog(AgentRole.QA_LEAD, "Planning Failed.", 'error');
      dispatch({ type: 'FINISH_PROCESSING' });
    }
  };

  const startExecution = async (tasksToRun: Task[]) => {
    dispatch({ type: 'SET_STEP', payload: 'TESTING' });
    addLog(AgentRole.TESTER, "Starting execution cycle...", 'info');
    let failureCount = 0;
    const currentCode = state.codeContext;
    
    // We iterate tasks sequentially to maintain logical order in logs
    for (const task of tasksToRun) {
      dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { status: TaskStatus.RUNNING } } });
      
      // Pass progress report to simulation so Tester knows history
      try {
        const result = await GeminiService.executeTestSimulation(currentCode, task, state.progressReport);
        
        if (result.passed) {
          dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { status: TaskStatus.PASSED, resultLog: result.reason } } });
          addLog(AgentRole.TESTER, `Task ${task.id}: PASSED`, 'success');
          await updateReport("TEST_PASS", `Task ${task.id} Passed: ${result.reason}`);
        } else {
          failureCount++;
          dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { status: TaskStatus.FAILED, failureReason: result.reason } } });
          addLog(AgentRole.TESTER, `Task ${task.id}: FAILED - ${result.reason}`, 'error');
          await updateReport("TEST_FAIL", `Task ${task.id} Failed: ${result.reason}`);
        }
      } catch (e) {
        addLog(AgentRole.TESTER, `Task ${task.id}: ERROR`, 'error');
      }
      // Small delay for UI update
      await new Promise(r => setTimeout(r, 200));
    }

    // Auto-upload after testing cycle
    handleCloudUpload(false, state.progressReport);

    if (failureCount > 0) {
      addLog(AgentRole.QA_LEAD, `${failureCount} tasks failed. Fix Protocol initiated.`, 'warning');
      startFixing();
    } else {
      addLog(AgentRole.QA_LEAD, "All systems operational. No issues found.", 'success');
      const newReport = await updateReport("COMPLETION", "All tests passed successfully.");
      handleCloudUpload(false, newReport); // Final upload
      dispatch({ type: 'FINISH_PROCESSING' });
    }
  };

  const startFixing = async () => {
    dispatch({ type: 'SET_STEP', payload: 'FIXING' });
    const failedTasks = state.tasks.filter(t => t.status === TaskStatus.FAILED);
    addLog(AgentRole.FIXER, `Analyzing ${failedTasks.length} failures...`, 'info');
    let newCode = state.codeContext;
    
    for (const task of failedTasks) {
       addLog(AgentRole.FIXER, `Fixing ${task.id}...`, 'info');
       try {
         // Pass progress report so Fixer knows exactly what failed and why
         const fix = await GeminiService.generateFix(state.codeContext, task, state.progressReport);
         
         dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { fixSuggestion: fix } } });
         addLog(AgentRole.FIXER, `Fix generated for ${task.id}`, 'success');
         await updateReport("FIX_PROPOSED", `Fix for ${task.id} suggested.`);
         newCode = newCode + `\n\n// FIX FOR ${task.id} (Cycle ${state.currentCycle}):\n${fix}`;
       } catch (e) {
         addLog(AgentRole.FIXER, `Failed to fix ${task.id}`, 'error');
       }
    }
    
    dispatch({ type: 'SET_CODE', payload: newCode });
    // Auto-upload after fixes generated
    handleCloudUpload(false, state.progressReport);
    
    checkRegression();
  };

  const checkRegression = async () => {
    if (state.currentCycle >= state.maxCycles) {
      addLog(AgentRole.QA_LEAD, "Max cycles reached. Halting to prevent loops.", 'error');
      const newReport = await updateReport("STOP", "Max cycles reached. Manual intervention required.");
      handleCloudUpload(false, newReport);
      dispatch({ type: 'FINISH_PROCESSING' });
      return;
    }
    dispatch({ type: 'SET_STEP', payload: 'REGRESSION_CHECK' });
    dispatch({ type: 'INCREMENT_CYCLE' });
    addLog(AgentRole.QA_LEAD, `Cycle ${state.currentCycle} complete. Starting Regression Test...`, 'warning');
    const newReport = await updateReport("CYCLE_COMPLETE", `Starting Cycle ${state.currentCycle} regression.`);
    handleCloudUpload(false, newReport);
    
    const resetTasks = state.tasks.map(t => ({ 
      ...t, 
      status: TaskStatus.PENDING, 
      resultLog: undefined, 
      failureReason: undefined 
    }));
    dispatch({ type: 'SET_TASKS', payload: resetTasks });
    setTimeout(() => startExecution(resetTasks), 1500);
  };

  // --- RENDER HELPERS ---

  const renderFileBrowser = (isDashboardMode = false) => (
    <div className={`${isDashboardMode ? 'max-h-64' : 'flex-1'} flex flex-col overflow-hidden bg-slate-900/50 rounded border border-slate-700/50`}>
        {/* Browser Header */}
        <div className="flex items-center justify-between p-2 border-b border-slate-700/50 bg-slate-800/30">
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">{repoInput}/{currentPath}</span>
            {isDashboardMode && (
                 <button onClick={() => setShowGithubBrowser(false)} className="text-slate-500 hover:text-slate-300">
                   <Bug className="w-3 h-3 rotate-45" /> 
                 </button>
            )}
        </div>
        
        {/* File List */}
        <div className="flex-1 overflow-y-auto p-2">
            {currentPath && (
                <div 
                onClick={() => handleNavigateDir(currentPath.split('/').slice(0, -1).join('/'))}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 cursor-pointer text-slate-400 text-xs rounded mb-1"
                >
                    <ArrowLeft className="w-3 h-3" />
                    <span>..</span>
                </div>
            )}
            
            {githubFiles.length === 0 && !isGithubLoading && (
                <div className="text-center text-slate-500 text-xs py-4">No files found.</div>
            )}

            {githubFiles.map(file => {
               const isSelected = selectedPaths.has(file.path);
               return (
                <div 
                    key={file.sha}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded transition-colors group ${isSelected ? 'bg-blue-900/20' : 'hover:bg-slate-800'}`}
                >
                    <div 
                       onClick={(e) => { e.stopPropagation(); toggleSelection(file); }}
                       className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                           file.type === 'dir' 
                           ? 'border-transparent' 
                           : isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600 hover:border-slate-400'
                       }`}
                    >
                       {file.type !== 'dir' && isSelected && <CheckCheck className="w-3 h-3 text-white" />}
                    </div>

                    <div 
                        onClick={() => file.type === 'dir' ? handleNavigateDir(file.path) : toggleSelection(file)}
                        className="flex-1 flex items-center gap-2 cursor-pointer min-w-0"
                    >
                        {file.type === 'dir' ? <Folder className="w-3 h-3 text-blue-400 shrink-0" /> : <FileCode className="w-3 h-3 text-yellow-500 shrink-0" />}
                        <span className={`truncate text-xs ${isSelected ? 'text-blue-200' : 'text-slate-300'}`}>{file.name}</span>
                    </div>
                </div>
               );
            })}
        </div>
        
        {/* Footer Actions */}
        <div className="p-2 border-t border-slate-700/50 bg-slate-800/30 flex justify-between items-center">
            <span className="text-[10px] text-slate-500">{selectedPaths.size} selected</span>
            <button 
                onClick={handleImportSelectedFiles}
                disabled={selectedPaths.size === 0 || isGithubLoading}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs px-3 py-1.5 rounded flex items-center gap-1.5"
            >
                {isGithubLoading ? <RotateCw className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
                Add to Context
            </button>
        </div>
    </div>
  );

  // --- VIEW: ONBOARDING ---
  if (state.currentView === 'ONBOARDING') {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative Background */}
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
            {/* CONNECTION SECTION */}
            {!isConnected ? (
              <div className="flex flex-col gap-4 shrink-0">
                {!isTokenMode ? (
                  <div className="flex flex-col gap-3">
                     <button 
                        onClick={() => setIsTokenMode(true)}
                        className="w-full bg-[#24292f] hover:bg-[#2b3137] text-white p-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-lg border border-transparent hover:border-slate-600"
                     >
                        <Github className="w-5 h-5" /> Connect GitHub Account
                     </button>
                     <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="h-px bg-slate-800 flex-1"></div>
                        <span>OR ENTER PUBLIC REPO</span>
                        <div className="h-px bg-slate-800 flex-1"></div>
                     </div>
                     <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-sm px-4 py-2 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="e.g. facebook/react"
                            value={repoInput}
                            onChange={(e) => setRepoInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFetchRepo()}
                        />
                        <button 
                            onClick={() => handleFetchRepo()}
                            disabled={isGithubLoading || !repoInput}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded-lg text-sm"
                        >
                            Go
                        </button>
                     </div>
                  </div>
                ) : (
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-3 animate-fadeIn">
                     <div className="flex items-center justify-between">
                         <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                             <Key className="w-4 h-4 text-yellow-500" /> Enter Personal Access Token
                         </h3>
                         <button onClick={() => setIsTokenMode(false)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
                     </div>
                     <p className="text-[10px] text-slate-400">
                         Create a Classic Token with <code>repo</code> scope to access private repositories.
                     </p>
                     <div className="flex gap-2">
                         <input 
                            type="password"
                            className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded focus:border-blue-500 focus:outline-none"
                            placeholder="ghp_xxxxxxxxxxxx"
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                         />
                         <button 
                            onClick={handleConnectGithub}
                            disabled={isGithubLoading}
                            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-medium"
                         >
                            {isGithubLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : 'Connect'}
                         </button>
                     </div>
                  </div>
                )}
              </div>
            ) : (
                <div className="flex items-center justify-between bg-green-900/20 border border-green-900/50 p-3 rounded-lg shrink-0">
                    <div className="flex items-center gap-2">
                        <CheckCheck className="w-4 h-4 text-green-400" />
                        <span className="text-green-200 text-sm font-medium">GitHub Connected</span>
                    </div>
                    <button onClick={handleDisconnect} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                        <LogOut className="w-3 h-3" /> Disconnect
                    </button>
                </div>
            )}

            {/* BROWSER AREA */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-950/30 rounded-lg border border-slate-800 overflow-hidden">
                {!githubFiles.length ? (
                    isConnected ? (
                        <div className="flex-1 overflow-y-auto p-2">
                            <div className="text-xs text-slate-500 px-2 py-2 font-bold uppercase">Your Repositories</div>
                            {userRepos.map(repo => (
                                <div 
                                    key={repo.id}
                                    onClick={() => handleFetchRepo(repo.full_name)}
                                    className="flex items-center gap-3 p-3 hover:bg-slate-800 cursor-pointer border-b border-slate-800/50 transition-colors group"
                                >
                                    <div className={`p-1.5 rounded ${repo.private ? 'bg-yellow-900/20 text-yellow-500' : 'bg-blue-900/20 text-blue-400'}`}>
                                        {repo.private ? <Lock className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm text-slate-200 font-medium truncate group-hover:text-blue-400">{repo.full_name}</div>
                                        <div className="text-[10px] text-slate-500 truncate">{repo.description || "No description"}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-3">
                           {!repoInput && !githubFiles.length && (
                               <>
                                <Terminal className="w-8 h-8 opacity-20" />
                                <p className="text-sm">Connect GitHub or enter a repo to start.</p>
                               </>
                           )}
                           {repoInput && !githubFiles.length && isGithubLoading && (
                                <div className="text-sm text-blue-400 flex items-center gap-2">
                                    <RotateCw className="w-4 h-4 animate-spin" /> Fetching {repoInput}...
                                </div>
                           )}
                        </div>
                    )
                ) : (
                    <div className="flex-1 flex flex-col min-h-0">
                         <div className="p-2 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-mono truncate">{repoInput}/{currentPath}</span>
                            <button onClick={() => { setGithubFiles([]); setRepoInput(''); }} className="text-xs text-slate-500 hover:text-white">Close</button>
                        </div>
                        {renderFileBrowser(false)}
                    </div>
                )}
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-600 shrink-0">
             Powered by Google Gemini 3 Flash • Secure Client-Side Only
          </div>

        </div>
      </div>
    );
  }

  // --- VIEW: DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col p-4 md:p-6 gap-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'ONBOARDING' })}>
                 <Home className="w-5 h-5" />
            </div>
            <div className="h-6 w-px bg-slate-700 mx-1"></div>
            <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    {repoInput || 'Local Session'} 
                    <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">Mission Control</span>
                </h1>
            </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Clear Session Button */}
           <button 
             onClick={() => {
                if(window.confirm("Clear all session data? This cannot be undone.")) {
                    dispatch({ type: 'CLEAR_SESSION' });
                    setRepoInput('');
                    setGithubFiles([]);
                    setSelectedPaths(new Set());
                }
             }}
             className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
             title="Clear Saved Session"
           >
              <Trash2 className="w-4 h-4" />
           </button>

          <button 
            onClick={startAnalysis}
            disabled={state.isProcessing || !hasApiKey}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-md font-medium transition-all shadow-lg
              ${state.isProcessing 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/25'
              }`}
          >
            {state.isProcessing ? <RotateCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            {state.isProcessing ? 'Agents Working...' : 'Start QA Cycle'}
          </button>
        </div>
      </header>

      {/* DASHBOARD CONTENT */}
      <div className="flex-1 flex flex-col min-h-0 gap-6">
        
        {/* TOP: Stats Bar (HUD) */}
        <DashboardStats tasks={state.tasks} currentCycle={state.currentCycle} />

        {/* MAIN GRID: 3 Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
            
            {/* LEFT: THE PLAN (Tasks) - Col Span 3 */}
            <div className="lg:col-span-3 flex flex-col gap-4 min-h-[400px]">
                <TaskList tasks={state.tasks} />
            </div>

            {/* CENTER: THE PROCESS (Active Monitor + Logs) - Col Span 5 */}
            <div className="lg:col-span-5 flex flex-col gap-4 min-h-[400px]">
                {/* Active Monitor: Focus on current task */}
                <div className="h-1/3 min-h-[180px]">
                    <ActiveTaskMonitor tasks={state.tasks} />
                </div>
                {/* Agent Logs: Detailed stream */}
                <div className="flex-1 min-h-[300px]">
                    <AgentLog logs={state.logs} />
                </div>
            </div>

            {/* RIGHT: THE RESULT (Report) - Col Span 4 */}
            <div className="lg:col-span-4 flex flex-col gap-4 min-h-[400px]">
                <ProgressReport 
                    report={state.progressReport} 
                    onUpload={() => handleCloudUpload(true)} 
                    cloudinaryConfig={state.cloudinaryConfig}
                    onUpdateCloudConfig={handleUpdateCloudConfig}
                />
                
                {/* Mini Code Context Viewer (Optional) */}
                <div className="h-1/3 bg-slate-900 rounded-lg border border-slate-700 flex flex-col overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                    <div className="bg-slate-800 p-2 border-b border-slate-700 flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                             <FileCode className="w-3 h-3" /> Source Context
                        </span>
                        <span className="text-[10px] text-slate-600">{estimatedTokens.toLocaleString()} tokens</span>
                    </div>
                    <textarea
                        className="flex-1 bg-slate-950 text-[10px] font-mono p-2 text-slate-500 resize-none focus:outline-none"
                        value={state.codeContext.substring(0, 1000) + (state.codeContext.length > 1000 ? '...' : '')}
                        readOnly
                    />
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}