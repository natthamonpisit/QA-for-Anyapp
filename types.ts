
export enum AgentRole {
  ARCHITECT = 'ARCHITECT', // Reads code, summarizes logic
  QA_LEAD = 'QA_LEAD',     // Breaks down tasks
  TESTER = 'TESTER',       // Simulates execution & validates
  FIXER = 'FIXER',         // Proposes fixes
}

export enum TaskStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

export interface Task {
  id: string;
  description: string;
  expectedResult: string;
  status: TaskStatus;
  resultLog?: string;
  failureReason?: string;
  fixSuggestion?: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  role: AgentRole;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

export interface AppState {
  codeContext: string;
  functionSummary: string;
  tasks: Task[];
  logs: LogEntry[];
  progressReport: string; // The "scratchpad"
  isProcessing: boolean;
  currentCycle: number;
  maxCycles: number;
  workflowStep: 'IDLE' | 'ANALYZING' | 'PLANNING' | 'TESTING' | 'FIXING' | 'REGRESSION_CHECK' | 'COMPLETED';
  currentView: 'ONBOARDING' | 'DASHBOARD'; // State to control the active view
  cloudinaryConfig: CloudinaryConfig; 
  sessionId: string; // New: To identify the cloud file for this session
}
