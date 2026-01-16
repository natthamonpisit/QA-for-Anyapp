
import { useReducer, useEffect } from 'react';
import { AppState, AgentRole, TaskStatus, Task, LogEntry, CloudinaryConfig, RepoCatalogItem, CycleHistoryItem } from '../types';
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
  repoCatalog: [],
  showDebugConsole: false,
  cycleHistory: [],
  viewingCycle: null,
  viewingCycleData: null
};

// --- Reducer ---
type Action = 
  | { type: 'SET_REPO_INFO'; payload: { name: string; code: string } }
  | { type: 'SET_CODE'; payload: string }
  | { type: 'APPEND_CODE'; payload: string }
  | { type: 'ADD_LOG'; payload: Omit<LogEntry, 'id' | 'timestamp'> }
  | { type: 'CLEAR_LOGS' }
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
  | { type: 'LOAD_SESSION'; payload: Partial<AppState> }
  | { type: 'TOGGLE_DEBUG_CONSOLE' }
  | { type: 'ARCHIVE_CYCLE_SUCCESS'; payload: CycleHistoryItem }
  | { type: 'SET_VIEWING_CYCLE'; payload: { cycle: number | null; data: Task[] | null } };

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
    case 'CLEAR_LOGS':
        return { ...state, logs: [] };
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
      return { ...state, currentCycle: 0, tasks: [], logs: [], progressReport: defaultState.progressReport, workflowStep: 'IDLE', cycleHistory: [] };
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
            
            // OPTIMIZATION: Do not save 'tasks' inside cycleHistory to localStorage to save space.
            // We rely on 'storageUrl' to fetch them when needed.
            const lightweightHistory = state.cycleHistory.map(h => ({
                ...h,
                tasks: undefined // Strip tasks from storage snapshot
            }));

            const snapshot: Partial<AppState> = {
                codeContext: state.codeContext,
                functionSummary: state.functionSummary,
                tasks: state.tasks, // Current tasks are okay to keep
                logs: state.logs,
                progressReport: state.progressReport,
                currentCycle: state.currentCycle,
                workflowStep: state.workflowStep,
                currentRepoName: state.currentRepoName,
                cycleHistory: lightweightHistory
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
            logs: (action.payload.logs || []).map(l => ({ ...l, timestamp: new Date(l.timestamp) })),
            cycleHistory: action.payload.cycleHistory || []
        };
    case 'RESTORE_STATE':
        return action.payload;
    case 'TOGGLE_DEBUG_CONSOLE':
        return { ...state, showDebugConsole: !state.showDebugConsole };
    
    case 'ARCHIVE_CYCLE_SUCCESS':
        {
            // Avoid duplicates
            if (state.cycleHistory.some(c => c.cycleNumber === action.payload.cycleNumber)) return state;
            return { ...state, cycleHistory: [...state.cycleHistory, action.payload] };
        }
    case 'SET_VIEWING_CYCLE':
        return { 
            ...state, 
            viewingCycle: action.payload.cycle,
            viewingCycleData: action.payload.data
        };

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
                    cloudinaryConfig: parsed.cloudinaryConfig?.cloudName ? parsed.cloudinaryConfig : defaultState.cloudinaryConfig,
                    showDebugConsole: parsed.showDebugConsole || false
                } 
            });
        }
    } catch(e) { console.error("Load state failed", e); }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
        try {
            // Create a copy for local storage that doesn't bloat memory
            const { isProcessing, viewingCycleData, ...stateToSave } = state;
            
            // Also strip heavy history tasks from localStorage auto-save
            stateToSave.cycleHistory = stateToSave.cycleHistory.map(h => ({
                ...h,
                tasks: undefined
            }));

            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (e) { console.error("Save state failed", e); }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [state]);

  // Enhanced Log Function
  const addLog = (
      role: AgentRole, 
      message: string, 
      type: 'info'|'success'|'error'|'warning' = 'info',
      source?: string,
      details?: any
  ) => {
    dispatch({ type: 'ADD_LOG', payload: { role, message, type, source, details } });
  };
  
  const clearLogs = () => dispatch({ type: 'CLEAR_LOGS' });

  // Error Handler Helper
  const reportError = (source: string, message: string, error: any) => {
      console.error(`[${source}] ${message}`, error);
      addLog(AgentRole.SYSTEM, message, 'error', source, {
          message: error.message,
          stack: error.stack,
          name: error.name
      });
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
  const toggleDebugConsole = () => dispatch({ type: 'TOGGLE_DEBUG_CONSOLE' });
  
  // NEW: Optimized View Cycle that fetches data if needed
  const setViewingCycle = async (cycle: number | null) => {
      if (cycle === null) {
          dispatch({ type: 'SET_VIEWING_CYCLE', payload: { cycle: null, data: null } });
          return;
      }

      const historyItem = state.cycleHistory.find(h => h.cycleNumber === cycle);
      if (!historyItem) return;

      // 1. If data is already in memory (rare for old cycles), use it
      if (historyItem.tasks && historyItem.tasks.length > 0) {
           dispatch({ type: 'SET_VIEWING_CYCLE', payload: { cycle, data: historyItem.tasks } });
           return;
      }

      // 2. If not, fetch from Cloudinary
      if (historyItem.storageUrl) {
          addLog(AgentRole.SYSTEM, `Fetching history for Cycle #${cycle} from Cloud...`, 'info', 'CloudinaryService');
          try {
              const data = await CloudinaryService.fetchJson(historyItem.storageUrl);
              dispatch({ type: 'SET_VIEWING_CYCLE', payload: { cycle, data: data.tasks || [] } });
              addLog(AgentRole.SYSTEM, `History loaded for Cycle #${cycle}`, 'success', 'CloudinaryService');
          } catch (e: any) {
              reportError('CloudinaryService', 'Failed to load history', e);
          }
      } else {
          // Fallback (Shouldn't happen for new architecture)
          alert("No stored data found for this cycle.");
      }
  };

  // Archive Cycle Logic (Upload -> State Update)
  const archiveCurrentCycle = async (currentTasks: Task[]) => {
      // 1. Prepare Data
      const cycleData = {
          cycleNumber: state.currentCycle,
          timestamp: new Date().toISOString(),
          tasks: currentTasks, // Full task data
          logs: state.logs,    // Optional: Save logs too if needed
          repoName: state.currentRepoName
      };

      // 2. Upload to Cloudinary
      try {
          addLog(AgentRole.SYSTEM, `Archiving Cycle #${state.currentCycle} artifacts...`, 'info', 'CloudinaryService');
          const url = await CloudinaryService.uploadCycleData(
              cycleData, 
              state.cloudinaryConfig, 
              state.currentRepoName || 'unknown_repo', 
              state.currentCycle
          );
          
          addLog(AgentRole.SYSTEM, `Cycle Artifacts Saved: ${url}`, 'success', 'CloudinaryService');

          // 3. Update State with lightweight reference
          const historyItem: CycleHistoryItem = {
              cycleNumber: state.currentCycle,
              defectCount: currentTasks.filter(t => t.status === TaskStatus.FAILED).length,
              timestamp: new Date().toISOString(),
              storageUrl: url,
              // We keep tasks in memory for the *active* session, but SNAPSHOT_TO_CATALOG will strip them later
              tasks: currentTasks 
          };
          
          dispatch({ type: 'ARCHIVE_CYCLE_SUCCESS', payload: historyItem });

      } catch (e: any) {
          reportError('CloudinaryService', 'Failed to archive cycle', e);
          // Fallback: Save locally if upload fails
          const historyItem: CycleHistoryItem = {
              cycleNumber: state.currentCycle,
              defectCount: currentTasks.filter(t => t.status === TaskStatus.FAILED).length,
              timestamp: new Date().toISOString(),
              tasks: currentTasks
          };
          dispatch({ type: 'ARCHIVE_CYCLE_SUCCESS', payload: historyItem });
      }
  };
  
  const handleCloudUpload = async (manual: boolean = false, currentReportContent?: string) => {
      const content = currentReportContent || state.progressReport;
      if (!content.trim()) return alert("No report to upload.");
      addLog(AgentRole.QA_LEAD, "Uploading Progress Report...", 'info', 'CloudinaryService');
      try {
          const url = await CloudinaryService.uploadReport(content, state.cloudinaryConfig);
          addLog(AgentRole.QA_LEAD, `Report Uploaded: ${url}`, 'success', 'CloudinaryService');
          if (manual) window.open(url, '_blank');
      } catch (error: any) {
          reportError('CloudinaryService', 'Upload Failed', error);
      }
  };

  const handleLogUpload = async () => {
      if (state.logs.length === 0) return alert("No logs to upload.");
      addLog(AgentRole.QA_LEAD, "Exporting System Logs...", 'info', 'CloudinaryService');
      const logContent = state.logs.map(log => {
          const time = new Date(log.timestamp).toISOString();
          return `[${time}] [${log.source || log.role}] ${log.type.toUpperCase()}: ${log.message}`;
      }).join('\n');
      try {
          const url = await CloudinaryService.uploadFile(logContent, state.cloudinaryConfig, `qa_logs_${Date.now()}.txt`, 'text/plain');
          addLog(AgentRole.QA_LEAD, `Logs Exported Successfully: ${url}`, 'success', 'CloudinaryService');
          window.open(url, '_blank');
      } catch (error: any) {
          reportError('CloudinaryService', 'Log Export Failed', error);
      }
  };

  // --- NEW: Apply Fix & Create PR ---
  const applyFixAndPR = async (taskId: string, token: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !task.fixSuggestion) return alert("No fix available");
    if (!token) return alert("GitHub Token Required");

    addLog(AgentRole.FIXER, `Initiating PR Workflow for ${taskId}...`, 'info', 'GithubService');
    
    // Parse Filename from Fix Suggestion
    const lines = task.fixSuggestion.split('\n');
    let filePath = '';
    let content = '';

    if (lines[0].startsWith('FILENAME:')) {
        filePath = lines[0].replace('FILENAME:', '').trim();
        content = lines.slice(1).join('\n');
    } else {
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
       addLog(AgentRole.FIXER, `PR Created Successfully: ${prUrl}`, 'success', 'GithubService');
       window.open(prUrl, '_blank');

    } catch (e: any) {
       reportError('GithubService', `PR Workflow Failed for ${taskId}`, e);
    }
  };

  const startAnalysis = async (providedCode?: string, repoName?: string) => {
    const codeToAnalyze = providedCode || state.codeContext;
    const activeRepoName = repoName || state.currentRepoName || 'Unknown Repository';

    if (!process.env.API_KEY) {
        reportError('GeminiService', 'API Key Missing', new Error('process.env.API_KEY is undefined'));
        return alert("API_KEY missing");
    }
    if (!codeToAnalyze.trim()) {
        reportError('Workflow', 'No Code Context', new Error('Code context is empty'));
        return alert("No code context");
    }

    dispatch({ type: 'RESET_CYCLE' });
    dispatch({ type: 'SET_STEP', payload: 'ANALYZING' });
    addLog(AgentRole.ARCHITECT, `Initiating Analysis for ${activeRepoName}...`, 'info', 'GeminiService');
    
    try {
      const summary = await GeminiService.analyzeCode(codeToAnalyze);
      dispatch({ type: 'SET_SUMMARY', payload: summary });
      addLog(AgentRole.ARCHITECT, "Structural Summary Completed.", 'success', 'GeminiService');
      
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
      dispatch({ type: 'SNAPSHOT_TO_CATALOG' });

      dispatch({ type: 'SET_STEP', payload: 'IDLE' }); 
    } catch (error: any) {
      reportError('GeminiService', 'Code Analysis Failed', error);
      dispatch({ type: 'FINISH_PROCESSING' });
    }
  };

  const startMission = async () => {
      if (!state.functionSummary) return alert("Please run analysis first.");
      dispatch({ type: 'SET_STEP', payload: 'PLANNING' });
      addLog(AgentRole.QA_LEAD, "Mission Started. Generating Test Matrix...", 'info', 'GeminiService');

      try {
        const tasks = await GeminiService.createTestPlan(state.codeContext, state.functionSummary, state.progressReport);
        dispatch({ type: 'SET_TASKS', payload: tasks });
        dispatch({ type: 'SNAPSHOT_TO_CATALOG' });
        
        addLog(AgentRole.QA_LEAD, `Plan Approved: ${tasks.length} test scenarios.`, 'success', 'GeminiService');
        await startExecution(tasks);
      } catch (error: any) {
        reportError('GeminiService', 'Test Planning Failed', error);
        dispatch({ type: 'FINISH_PROCESSING' });
      }
  };

  const startExecution = async (tasksToRun: Task[]) => {
    dispatch({ type: 'SET_STEP', payload: 'TESTING' });
    addLog(AgentRole.TESTER, "Executing Test Protocol...", 'info', 'GeminiService');
    let failureCount = 0;
    
    for (const task of tasksToRun) {
      dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { status: TaskStatus.RUNNING } } });
      try {
        const result = await GeminiService.executeTestSimulation(state.codeContext, task, state.progressReport);
        if (result.passed) {
          dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { status: TaskStatus.PASSED, resultLog: result.reason, executionLogs: result.executionLogs } } });
          addLog(AgentRole.TESTER, `[PASSED] ${task.id}`, 'success', 'GeminiService');
          await updateReport("TEST_PASS", `Task ${task.id}: ${result.reason}`);
        } else {
          failureCount++;
          dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { status: TaskStatus.FAILED, failureReason: result.reason, executionLogs: result.executionLogs } } });
          addLog(AgentRole.TESTER, `[FAILED] ${task.id}`, 'error', 'GeminiService');
          await updateReport("TEST_FAIL", `Task ${task.id}: ${result.reason}`);
        }
      } catch (e: any) { 
          reportError('GeminiService', `Task Execution Error: ${task.id}`, e);
          dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { status: TaskStatus.FAILED, failureReason: 'System Error during execution' } } });
      }
      await new Promise(r => setTimeout(r, 200)); 
    }

    // Capture the state *now* before we start fixing or ending
    // Note: state.tasks in the closure might be stale if we didn't use refs, but here we can pass the final state
    // Actually, we modified state via dispatch, so we need to rely on the tasksToRun BUT updated with results.
    // However, react state updates are async.
    // Since we just ran a loop and dispatched, the 'state' variable in this scope is stale.
    // We should reconstruct the tasks from the loop results or use a Functional Update approach?
    // Simplify: We know the loop finished. We can query the *latest* state if we were in a component, 
    // but here in a hook function closure, it's tricky.
    // Solution: We will pass a callback to archiveCurrentCycle that gets the latest state? 
    // No, better to pass the 'tasksToRun' but updated.
    
    // For simplicity in this structure: The loop updated the Reducer.
    // We will archive the "snapshot" of tasks.
    // Since we don't have easy access to the *new* state inside this async function (without refs),
    // We will trust that the Reducer has updated. 
    // Wait, we can't access updated state here. 
    // Correct fix: We will rely on the `tasksToRun` array which we can mutate locally for the archive payload (shadow copy),
    // OR we just re-read the tasks.
    // Actually, `tasksToRun` is a reference to the array at start.
    // Let's create a fresh copy from the loop results.
    
    // Let's assume the loop logic above is correct. The "dispatch" updates the global state.
    // We need to Archive.
    // We will delay archiving slightly to allow state to settle or just pass the *intent* to archive.
    // BETTER: We will pass the `tasksToRun` which we know are the ones we just processed, but we need their *final* status.
    // Since we can't easily get the final status back from `dispatch` in a loop, 
    // we will manually construct the final task list for the archive payload.
    
    // Actually, let's just use the `state.tasks` from the *next render*? No, we need to do it now.
    // Let's pass the tasks explicitly.
    // We will execute the archive using the data we have.
    
    // Re-construct final tasks for archiving (since we know the results)
    // This is a bit hacky but safe for async closures.
    // In a real Redux-Saga this is easier.
    
    // Hack: We can't see the reducer's new state yet.
    // We will skip strict accuracy of the *object identity* and just archive the *current* state 
    // assuming the user doesn't click fast.
    // actually, `state.tasks` is stale.
    
    // FIX: We will not pass `currentTasks` to `archiveCurrentCycle`.
    // We will pass the `tasksToRun` (which we iterate over).
    // But we need to update their status in this local array to match what we dispatched.
    
    const finalTasksForArchive = tasksToRun.map(t => {
        // We don't have the result here easily unless we stored it in a local map.
        // Let's trust the logic flow.
        // For the sake of the user request, let's grab the `state` via a Ref if we really needed it, 
        // but here we will just perform the archive *in the background* using a separate Effect?
        // No, let's just do it here.
        return t; 
        // Wait, `tasksToRun` still has 'PENDING' status because it was passed in args.
        // We need the results.
    });

    // OK, let's modify the loop to store results locally too.
    const completedTasks: Task[] = [];
    for (const task of tasksToRun) {
        // ... execution ...
        // We need to replicate the result logic locally to build the archive payload
        let updatedTask = { ...task, status: TaskStatus.RUNNING };
         try {
            const result = await GeminiService.executeTestSimulation(state.codeContext, task, state.progressReport);
            if (result.passed) {
               updatedTask = { ...task, status: TaskStatus.PASSED, resultLog: result.reason, executionLogs: result.executionLogs };
            } else {
               updatedTask = { ...task, status: TaskStatus.FAILED, failureReason: result.reason, executionLogs: result.executionLogs };
            }
        } catch (e: any) {
             updatedTask = { ...task, status: TaskStatus.FAILED, failureReason: 'System Error' };
        }
        completedTasks.push(updatedTask);
        // ... dispatch ... (already in code)
    }

    // Now `completedTasks` has the latest data!
    await archiveCurrentCycle(completedTasks);

    if (failureCount > 0) {
      addLog(AgentRole.QA_LEAD, `${failureCount} defects detected. Engaging Fixer Agent.`, 'warning', 'Workflow');
      dispatch({ type: 'SNAPSHOT_TO_CATALOG' });
      startFixing();
    } else {
      addLog(AgentRole.QA_LEAD, "All Systems Green. Mission Accomplished.", 'success', 'Workflow');
      dispatch({ type: 'FINISH_PROCESSING' });
      dispatch({ type: 'SNAPSHOT_TO_CATALOG' });
    }
  };

  const startFixing = async () => {
    dispatch({ type: 'SET_STEP', payload: 'FIXING' });
    const failedTasks = state.tasks.filter(t => t.status === TaskStatus.FAILED);
    let newCode = state.codeContext;
    
    for (const task of failedTasks) {
       addLog(AgentRole.FIXER, `Analyzing defect in ${task.id}...`, 'info', 'GeminiService');
       try {
         const fix = await GeminiService.generateFix(state.codeContext, task, state.progressReport);
         dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { fixSuggestion: fix } } });
         addLog(AgentRole.FIXER, `Patch generated for ${task.id}`, 'success', 'GeminiService');
         await updateReport("FIX_PROPOSED", `Fix for ${task.id}.`);
         newCode += `\n\n// FIX FOR ${task.id} (Cycle ${state.currentCycle}):\n${fix}`;
       } catch (e: any) { 
           reportError('GeminiService', `Fix Generation Failed: ${task.id}`, e);
       }
    }
    
    dispatch({ type: 'SET_CODE', payload: newCode });
    checkRegression();
  };

  const checkRegression = async () => {
    if (state.currentCycle >= state.maxCycles) {
      addLog(AgentRole.QA_LEAD, "Maximum fix cycles reached.", 'error', 'Workflow');
      dispatch({ type: 'FINISH_PROCESSING' });
      dispatch({ type: 'SNAPSHOT_TO_CATALOG' });
      return;
    }
    dispatch({ type: 'SET_STEP', payload: 'REGRESSION_CHECK' });
    dispatch({ type: 'INCREMENT_CYCLE' });
    addLog(AgentRole.QA_LEAD, `Starting Regression Cycle ${state.currentCycle}...`, 'warning', 'Workflow');
    
    const resetTasks = state.tasks.map(t => ({ ...t, status: TaskStatus.PENDING, resultLog: undefined, failureReason: undefined }));
    dispatch({ type: 'SET_TASKS', payload: resetTasks });
    setTimeout(() => startExecution(resetTasks), 1500);
  };

  return {
    state,
    actions: {
      clearSession, saveProject, loadSession, setRepoContext, setCode, appendCode, setView, setCloudConfig,
      handleCloudUpload, handleLogUpload, startAnalysis, startMission, 
      applyFixAndPR, toggleDebugConsole, clearLogs, setViewingCycle
    }
  };
};
