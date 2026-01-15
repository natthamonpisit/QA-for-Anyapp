
import { useReducer, useEffect } from 'react';
import { AppState, AgentRole, TaskStatus, Task, LogEntry, CloudinaryConfig, RepoCatalogItem } from '../types';
import * as GeminiService from '../services/geminiService';
import * as CloudinaryService from '../services/cloudinaryService';
import * as GithubService from '../services/githubService';
import { CONFIG, INITIAL_REPORT_TEMPLATE } from '../config';

// --- Default State ---
const defaultState: AppState = {
  currentRepoName: '',
  codeContext: '', 
  functionSummary: '', 
  tasks: [], 
  logs: [], 
  progressReport: INITIAL_REPORT_TEMPLATE, 
  isProcessing: false, 
  currentCycle: 0, 
  maxCycles: CONFIG.MAX_CYCLES,
  workflowStep: 'IDLE', 
  currentView: 'ONBOARDING',
  cloudinaryConfig: { 
    cloudName: CONFIG.CLOUDINARY_CLOUD_NAME, 
    uploadPreset: CONFIG.CLOUDINARY_PRESET 
  },
  sessionId: `${CONFIG.DEFAULT_SESSION_ID_PREFIX}${Date.now()}`,
  repoCatalog: [] 
};

// --- Reducer ---
type Action = 
  | { type: 'SET_REPO_INFO'; payload: { name: string; code: string } }
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
  | { type: 'CLEAR_SESSION' }
  | { type: 'RESTORE_STATE'; payload: AppState }
  | { type: 'SAVE_TO_CATALOG'; payload: RepoCatalogItem }
  | { type: 'SNAPSHOT_TO_CATALOG' } 
  | { type: 'LOAD_SESSION'; payload: Partial<AppState> }; 

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_REPO_INFO':
      return { ...state, currentRepoName: action.payload.name, codeContext: action.payload.code };
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
      return { 
          ...defaultState, 
          sessionId: `${CONFIG.DEFAULT_SESSION_ID_PREFIX}${Date.now()}`,
          repoCatalog: state.repoCatalog,
          cloudinaryConfig: state.cloudinaryConfig
      };
    case 'SAVE_TO_CATALOG':
        {
            const existingIndex = state.repoCatalog.findIndex(item => item.id === action.payload.id);
            let newCatalog = [...state.repoCatalog];
            if (existingIndex >= 0) {
                const existingState = newCatalog[existingIndex].savedState;
                newCatalog[existingIndex] = { ...action.payload, savedState: action.payload.savedState || existingState };
            } else {
                newCatalog = [action.payload, ...newCatalog];
            }
            return { ...state, repoCatalog: newCatalog };
        }
    case 'SNAPSHOT_TO_CATALOG':
        {
            if (!state.currentRepoName) return state; 
            const snapshot: Partial<AppState> = {
                codeContext: state.codeContext,
                functionSummary: state.functionSummary,
                tasks: state.tasks,
                logs: state.logs,
                progressReport: state.progressReport,
                currentCycle: state.currentCycle,
                workflowStep: state.workflowStep,
                currentRepoName: state.currentRepoName,
            };
            const existingIndex = state.repoCatalog.findIndex(item => item.id === state.currentRepoName);
            let newCatalog = [...state.repoCatalog];
            if (existingIndex >= 0) {
                newCatalog[existingIndex] = {
                    ...newCatalog[existingIndex],
                    lastAnalyzed: new Date().toISOString(),
                    savedState: snapshot
                };
            } else {
                newCatalog = [{
                    id: state.currentRepoName,
                    name: state.currentRepoName,
                    description: `Snapshot saved on ${new Date().toLocaleDateString()}`,
                    lastAnalyzed: new Date().toISOString(),
                    summarySnippet: state.functionSummary.substring(0, 100) + "...",
                    savedState: snapshot
                }, ...newCatalog];
            }
            return { ...state, repoCatalog: newCatalog };
        }
    case 'LOAD_SESSION':
        return {
            ...state,
            ...action.payload,
            isProcessing: false,
            workflowStep: action.payload.workflowStep === 'TESTING' || action.payload.workflowStep === 'FIXING' ? 'IDLE' : (action.payload.workflowStep || 'IDLE'),
            logs: (action.payload.logs || []).map(l => ({ ...l, timestamp: new Date(l.timestamp) }))
        };
    case 'RESTORE_STATE':
        return action.payload;
    default:
      return state;
  }
}

// --- Hook Implementation ---

export const useQAWorkflow = () => {
  const [state, dispatch] = useReducer(reducer, defaultState);

  useEffect(() => {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            dispatch({ 
                type: 'RESTORE_STATE', 
                payload: { 
                    ...defaultState, 
                    repoCatalog: parsed.repoCatalog || [], 
                    cloudinaryConfig: parsed.cloudinaryConfig?.cloudName ? parsed.cloudinaryConfig : defaultState.cloudinaryConfig
                } 
            });
        }
    } catch(e) { console.error("Load state failed", e); }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
        try {
            const { isProcessing, ...stateToSave } = state;
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (e) { console.error("Save state failed", e); }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [state]);

  const addLog = (role: AgentRole, message: string, type: 'info'|'success'|'error'|'warning' = 'info') => {
    dispatch({ type: 'ADD_LOG', payload: { role, message, type } });
  };

  const updateReport = async (action: string, detail: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const newReport = state.progressReport + `\n[${timestamp}] [${action}] ${detail}`;
    dispatch({ type: 'UPDATE_REPORT', payload: newReport });
    return newReport;
  };

  const clearSession = () => dispatch({ type: 'CLEAR_SESSION' });
  const saveProject = () => dispatch({ type: 'SNAPSHOT_TO_CATALOG' });
  const loadSession = (savedState: Partial<AppState>) => dispatch({ type: 'LOAD_SESSION', payload: savedState });
  const setRepoContext = (name: string, code: string) => dispatch({ type: 'SET_REPO_INFO', payload: { name, code } });
  const setCode = (code: string) => dispatch({ type: 'SET_CODE', payload: code });
  const appendCode = (code: string) => dispatch({ type: 'APPEND_CODE', payload: code });
  const setView = (view: AppState['currentView']) => dispatch({ type: 'SET_VIEW', payload: view });
  const setCloudConfig = (config: CloudinaryConfig) => dispatch({ type: 'SET_CLOUD_CONFIG', payload: config });
  
  const handleCloudUpload = async (manual: boolean = false, currentReportContent?: string) => {
      const content = currentReportContent || state.progressReport;
      if (!content.trim()) return alert("No report to upload.");
      addLog(AgentRole.QA_LEAD, "Uploading Progress Report...", 'info');
      try {
          const url = await CloudinaryService.uploadReport(content, state.cloudinaryConfig);
          addLog(AgentRole.QA_LEAD, `Report Uploaded: ${url}`, 'success');
          if (manual) window.open(url, '_blank');
      } catch (error: any) {
          addLog(AgentRole.QA_LEAD, `Upload Failed: ${error.message}`, 'error');
      }
  };

  const handleLogUpload = async () => {
      if (state.logs.length === 0) return alert("No logs to upload.");
      addLog(AgentRole.QA_LEAD, "Exporting System Logs...", 'info');
      const logContent = state.logs.map(log => {
          const time = new Date(log.timestamp).toISOString();
          return `[${time}] [${log.role}] ${log.type.toUpperCase()}: ${log.message}`;
      }).join('\n');
      try {
          const url = await CloudinaryService.uploadFile(logContent, state.cloudinaryConfig, `qa_logs_${Date.now()}.txt`, 'text/plain');
          addLog(AgentRole.QA_LEAD, `Logs Exported Successfully: ${url}`, 'success');
          window.open(url, '_blank');
      } catch (error: any) {
          addLog(AgentRole.QA_LEAD, `Log Export Failed: ${error.message}`, 'error');
      }
  };

  // --- NEW: Apply Fix & Create PR ---
  const applyFixAndPR = async (taskId: string, token: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !task.fixSuggestion) return alert("No fix available");
    if (!token) return alert("GitHub Token Required");

    addLog(AgentRole.FIXER, `Initiating PR Workflow for ${taskId}...`, 'info');
    
    // Parse Filename from Fix Suggestion
    // Expect format: "FILENAME: path/to/file \n code..."
    const lines = task.fixSuggestion.split('\n');
    let filePath = '';
    let content = '';

    if (lines[0].startsWith('FILENAME:')) {
        filePath = lines[0].replace('FILENAME:', '').trim();
        content = lines.slice(1).join('\n');
    } else {
        // Fallback or guess
        filePath = task.relatedFiles?.[0] || 'unknown_file.ts';
        content = task.fixSuggestion;
    }

    try {
       const prUrl = await GithubService.createFixPR(
           state.currentRepoName,
           token,
           filePath,
           content,
           task.description
       );
       
       dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates: { prUrl } } });
       addLog(AgentRole.FIXER, `PR Created Successfully: ${prUrl}`, 'success');
       window.open(prUrl, '_blank');

    } catch (e: any) {
       addLog(AgentRole.FIXER, `PR Failed: ${e.message}`, 'error');
    }
  };

  const startAnalysis = async (providedCode?: string, repoName?: string) => {
    const codeToAnalyze = providedCode || state.codeContext;
    const activeRepoName = repoName || state.currentRepoName || 'Unknown Repository';

    if (!process.env.API_KEY) return alert("API_KEY missing");
    if (!codeToAnalyze.trim()) return alert("No code context");

    dispatch({ type: 'RESET_CYCLE' });
    dispatch({ type: 'SET_STEP', payload: 'ANALYZING' });
    addLog(AgentRole.ARCHITECT, `Initiating Analysis for ${activeRepoName}...`, 'info');
    
    try {
      const summary = await GeminiService.analyzeCode(codeToAnalyze);
      dispatch({ type: 'SET_SUMMARY', payload: summary });
      addLog(AgentRole.ARCHITECT, "Structural Summary Completed.", 'success');
      
      const lines = summary.split('\n');
      const titleLine = lines.find(l => l.trim().startsWith('# '));
      let friendlyName = activeRepoName.split('/').pop() || activeRepoName;
      if (titleLine) {
          friendlyName = titleLine.replace(/^#\s+/, '').replace(/Technical Structural Summary:?\s*/i, '').trim();
      }

      dispatch({
          type: 'SAVE_TO_CATALOG',
          payload: {
              id: activeRepoName,
              name: friendlyName,
              description: `Analyzed on ${new Date().toLocaleDateString()}`,
              lastAnalyzed: new Date().toISOString(),
              summarySnippet: summary.substring(0, 150) + "..."
          }
      });
      dispatch({ type: 'SET_STEP', payload: 'IDLE' }); 
    } catch (error) {
      addLog(AgentRole.ARCHITECT, "Analysis Failed.", 'error');
      dispatch({ type: 'FINISH_PROCESSING' });
    }
  };

  const startMission = async () => {
      if (!state.functionSummary) return alert("Please run analysis first.");
      dispatch({ type: 'SET_STEP', payload: 'PLANNING' });
      addLog(AgentRole.QA_LEAD, "Mission Started. Generating Test Matrix...", 'info');

      try {
        const tasks = await GeminiService.createTestPlan(state.codeContext, state.functionSummary, state.progressReport);
        dispatch({ type: 'SET_TASKS', payload: tasks });
        addLog(AgentRole.QA_LEAD, `Plan Approved: ${tasks.length} test scenarios.`, 'success');
        await startExecution(tasks);
      } catch (error) {
        addLog(AgentRole.QA_LEAD, "Mission Aborted during planning.", 'error');
        dispatch({ type: 'FINISH_PROCESSING' });
      }
  };

  const startExecution = async (tasksToRun: Task[]) => {
    dispatch({ type: 'SET_STEP', payload: 'TESTING' });
    addLog(AgentRole.TESTER, "Executing Test Protocol...", 'info');
    let failureCount = 0;
    
    for (const task of tasksToRun) {
      dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { status: TaskStatus.RUNNING } } });
      try {
        const result = await GeminiService.executeTestSimulation(state.codeContext, task, state.progressReport);
        if (result.passed) {
          // Point C: Store executionLogs in state
          dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { status: TaskStatus.PASSED, resultLog: result.reason, executionLogs: result.executionLogs } } });
          addLog(AgentRole.TESTER, `[PASSED] ${task.id}`, 'success');
          await updateReport("TEST_PASS", `Task ${task.id}: ${result.reason}`);
        } else {
          failureCount++;
          // Point C: Store executionLogs in state
          dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { status: TaskStatus.FAILED, failureReason: result.reason, executionLogs: result.executionLogs } } });
          addLog(AgentRole.TESTER, `[FAILED] ${task.id}`, 'error');
          await updateReport("TEST_FAIL", `Task ${task.id}: ${result.reason}`);
        }
      } catch (e) { addLog(AgentRole.TESTER, `Task ${task.id}: ERROR`, 'error'); }
      await new Promise(r => setTimeout(r, 200)); 
    }

    if (failureCount > 0) {
      addLog(AgentRole.QA_LEAD, `${failureCount} defects detected. Engaging Fixer Agent.`, 'warning');
      startFixing();
    } else {
      addLog(AgentRole.QA_LEAD, "All Systems Green. Mission Accomplished.", 'success');
      dispatch({ type: 'FINISH_PROCESSING' });
    }
  };

  const startFixing = async () => {
    dispatch({ type: 'SET_STEP', payload: 'FIXING' });
    const failedTasks = state.tasks.filter(t => t.status === TaskStatus.FAILED);
    let newCode = state.codeContext;
    
    for (const task of failedTasks) {
       addLog(AgentRole.FIXER, `Analyzing defect in ${task.id}...`, 'info');
       try {
         const fix = await GeminiService.generateFix(state.codeContext, task, state.progressReport);
         dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { fixSuggestion: fix } } });
         addLog(AgentRole.FIXER, `Patch generated for ${task.id}`, 'success');
         await updateReport("FIX_PROPOSED", `Fix for ${task.id}.`);
         newCode += `\n\n// FIX FOR ${task.id} (Cycle ${state.currentCycle}):\n${fix}`;
       } catch (e) { addLog(AgentRole.FIXER, `Fix generation failed for ${task.id}`, 'error'); }
    }
    
    dispatch({ type: 'SET_CODE', payload: newCode });
    checkRegression();
  };

  const checkRegression = async () => {
    if (state.currentCycle >= state.maxCycles) {
      addLog(AgentRole.QA_LEAD, "Maximum fix cycles reached.", 'error');
      dispatch({ type: 'FINISH_PROCESSING' });
      return;
    }
    dispatch({ type: 'SET_STEP', payload: 'REGRESSION_CHECK' });
    dispatch({ type: 'INCREMENT_CYCLE' });
    addLog(AgentRole.QA_LEAD, `Starting Regression Cycle ${state.currentCycle}...`, 'warning');
    
    const resetTasks = state.tasks.map(t => ({ ...t, status: TaskStatus.PENDING, resultLog: undefined, failureReason: undefined }));
    dispatch({ type: 'SET_TASKS', payload: resetTasks });
    setTimeout(() => startExecution(resetTasks), 1500);
  };

  return {
    state,
    actions: {
      clearSession, saveProject, loadSession, setRepoContext, setCode, appendCode, setView, setCloudConfig,
      handleCloudUpload, handleLogUpload, startAnalysis, startMission, 
      applyFixAndPR // Export new action
    }
  };
};
